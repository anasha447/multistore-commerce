package com.ecommerce.store.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.SneakyThrows;
import org.springframework.cache.support.NullValue;
import org.springframework.data.redis.cache.RedisCache;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import org.springframework.data.redis.serializer.SerializationException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Spring's Redis caches with this shop's rules (CACHING.md): Redis may be gone, misses for one key are
 * loaded once, missing things are remembered briefly, lifetimes vary a little, groups clear by counting.
 */
class StoreCacheManager extends RedisCacheManager {

	/** Raised when the shape of cached values changes, so a deploy never reads an old one. */
	private static final String VERSION = "v1";

	private static final Duration MISSING = Duration.ofSeconds(30);

	private final StringRedisTemplate redis;

	private final RedisGuard guard;

	private final String store;

	private final Map<String, String> groups = new HashMap<>();

	private final List<StoreCache> caches = new ArrayList<>();

	/** Groups whose clear did not reach Redis. */
	private final Map<String, Object> unclearedGroups = new ConcurrentHashMap<>();

	StoreCacheManager(RedisConnectionFactory connections, StringRedisTemplate redis, RedisGuard guard, String store,
			List<CacheSpec> specs) {
		// by default Spring writes and clears in the background: a reader could still see what was just changed
		super(RedisCacheWriter.create(connections, writer -> writer.immediateWrites().collectStatistics()), RedisCacheConfiguration.defaultCacheConfig(),
				false, configurations(specs, store));
		this.redis = redis;
		this.guard = guard;
		this.store = store;
		specs.stream().filter(spec -> spec.group() != null).forEach(spec -> groups.put(spec.name(), spec.group()));
		setTransactionAware(true);
	}

	private static Map<String, RedisCacheConfiguration> configurations(List<CacheSpec> specs, String store) {
		JsonMapper json = JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES).build();
		Map<String, RedisCacheConfiguration> all = new HashMap<>();
		for (CacheSpec spec : specs) {
			all.put(spec.name(), RedisCacheConfiguration.defaultCacheConfig()
				.computePrefixWith(name -> "s:" + store + ":" + VERSION + ":" + name + ":")
				.entryTtl((key, value) -> (value == null || value instanceof NullValue) ? MISSING : vary(spec.lifetime()))
				.serializeValuesWith(SerializationPair.fromSerializer(new JacksonJsonRedisSerializer<>(json, spec.type()))));
		}
		return all;
	}

	/** Ten percent more or less, so entries do not expire together. */
	private static Duration vary(Duration lifetime) {
		return lifetime.multipliedBy(ThreadLocalRandom.current().nextLong(90, 111)).dividedBy(100);
	}

	@Override
	protected RedisCache createRedisCache(String name, RedisCacheConfiguration configuration) {
		StoreCache cache = new StoreCache(name, getCacheWriter(), configuration, groups.get(name));
		caches.add(cache);
		return cache;
	}

	/** Repeats the clears that failed while Redis was gone. Until one works, what it should have cleared is not read. */
	void repeatFailedClears() {
		caches.forEach(StoreCache::repeatFailedEvicts);
		unclearedGroups.forEach((group, mark) -> {
			if (countUp(group)) {
				unclearedGroups.remove(group, mark);
			}
		});
	}

	private boolean countUp(String group) {
		return guard.ask(() -> redis.opsForValue().increment(generationKey(group))).isPresent();
	}

	private String generationKey(String group) {
		return "s:" + store + ":gen:" + group;
	}

	private final class StoreCache extends RedisCache {

		private final String group;

		private final Map<Object, FutureTask<Object>> loading = new ConcurrentHashMap<>();

		/** Keys whose clear did not reach Redis; forgotten when the entry has expired anyway. */
		private final Cache<Object, Object> uncleared;

		private StoreCache(String name, RedisCacheWriter writer, RedisCacheConfiguration configuration, String group) {
			super(name, writer, configuration);
			this.group = group;
			Duration longest = configuration.getTtlFunction().getTimeToLive("", "").multipliedBy(2);
			this.uncleared = Caffeine.newBuilder().expireAfterWrite(longest).build();
		}

		/** Used by @Cacheable(sync = true). */
		@Override
		@SuppressWarnings("unchecked")
		public <T> T get(Object key, Callable<T> loader) {
			Optional<String> generation = generation();
			if (generation.isEmpty() || mayBeOld(key)) {
				return call(loader);
			}
			Object entry = group == null ? key : generation.get() + ":" + key;
			Optional<ValueWrapper> cached = ask(() -> super.get(entry));
			if (cached.isPresent()) {
				return (T) cached.get().get();
			}
			FutureTask<Object> mine = new FutureTask<>(() -> loader.call());
			FutureTask<Object> others = loading.putIfAbsent(entry, mine);
			if (others != null) {
				return (T) result(others);
			}
			mine.run();
			try {
				Object value = result(mine);
				// cleared meanwhile: what was loaded may already be old
				if (loading.get(entry) == mine) {
					ask(() -> {
						super.put(entry, value);
						return true;
					});
				}
				return (T) value;
			}
			finally {
				loading.remove(entry, mine);
			}
		}

		@Override
		public void evict(Object key) {
			loading.remove(key);
			if (!evicted(key)) {
				uncleared.put(key, new Object());
			}
		}

		private boolean evicted(Object key) {
			return ask(() -> {
				super.evict(key);
				return true;
			}).isPresent();
		}

		private void repeatFailedEvicts() {
			uncleared.asMap().forEach((key, mark) -> {
				if (evicted(key)) {
					// unless it failed again meanwhile
					uncleared.asMap().remove(key, mark);
				}
			});
		}

		private boolean mayBeOld(Object key) {
			return uncleared.getIfPresent(key) != null || (group != null && unclearedGroups.containsKey(group));
		}

		@Override
		public void clear() {
			if (group == null) {
				throw new UnsupportedOperationException(getName() + " belongs to no group; clear its keys");
			}
			loading.clear();
			if (!countUp(group)) {
				unclearedGroups.put(group, new Object());
			}
		}

		/** Empty when Redis did not say: then nothing cached may be used. */
		private Optional<String> generation() {
			return (group == null) ? Optional.of("")
					: ask(() -> Objects.requireNonNullElse(redis.opsForValue().get(generationKey(group)), "0"));
		}

		private <T> Optional<T> ask(Supplier<T> command) {
			try {
				return guard.ask(command);
			}
			catch (SerializationException ex) {
				return Optional.empty();
			}
		}

		private static Object result(FutureTask<Object> task) {
			return call(() -> {
				try {
					return task.get();
				}
				catch (ExecutionException ex) {
					throw (ex.getCause() instanceof Exception cause) ? cause : ex;
				}
			});
		}

		/** The service's own exception, as if there were no cache. */
		@SneakyThrows
		private static <T> T call(Callable<T> loader) {
			return loader.call();
		}

	}

}
