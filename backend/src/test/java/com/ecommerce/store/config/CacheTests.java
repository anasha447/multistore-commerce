package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.type.TypeFactory;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.exception.ApiException;

@IntegrationTest
class CacheTests {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private RedisConnectionFactory connections;

	@Autowired
	private MeterRegistry meters;

	@Autowired
	private TransactionTemplate transaction;

	private StoreCacheManager test;

	/** Keeps tests out of each other's entries. */
	private final String run = UUID.randomUUID().toString();

	private final AtomicInteger loads = new AtomicInteger();

	private final StoppableGuard stoppable = new StoppableGuard();

	/** Redis, gone at the push of a button. */
	private static final class StoppableGuard extends RedisGuard {

		private volatile boolean gone;

		@Override
		public <T> Optional<T> ask(Supplier<T> command) {
			return gone ? Optional.empty() : super.ask(command);
		}

	}

	@BeforeEach
	void createCaches() {
		JavaType string = TypeFactory.createDefaultInstance().constructType(String.class);
		test = new StoreCacheManager(connections, redis, stoppable, "matessa",
				List.of(new CacheSpec("plain", Duration.ofMinutes(10), string), new CacheSpec("list", Duration.ofMinutes(10), string, "g" + run),
						new CacheSpec("detail", Duration.ofMinutes(10), string, "g" + run)));
		test.afterPropertiesSet();
	}

	@Test
	void answersFromRedisUntilCleared() {
		String key = UUID.randomUUID().toString();
		assertThat(read("plain", key)).isEqualTo("value 1");
		assertThat(read("plain", key)).isEqualTo("value 1");
		test.getCache("plain").evict(key);
		assertThat(read("plain", key)).isEqualTo("value 2");
	}

	@Test
	void aGroupIsClearedTogetherByCounting() {
		read("list", "a" + run);
		read("detail", "b" + run);
		test.getCache("detail").clear();
		assertThat(read("list", "a" + run)).isEqualTo("value 3");
		assertThat(read("detail", "b" + run)).isEqualTo("value 4");
		assertThatExceptionOfType(UnsupportedOperationException.class).isThrownBy(() -> test.getCache("plain").clear());
	}

	@Test
	void clearingWaitsForTheCommitAndARollbackClearsNothing() {
		String key = UUID.randomUUID().toString();
		read("plain", key);
		transaction.executeWithoutResult(status -> {
			test.getCache("plain").evict(key);
			assertThat(read("plain", key)).as("before the commit").isEqualTo("value 1");
		});
		assertThat(read("plain", key)).as("after the commit").isEqualTo("value 2");
		transaction.executeWithoutResult(status -> {
			test.getCache("plain").evict(key);
			status.setRollbackOnly();
		});
		assertThat(read("plain", key)).as("after a rollback").isEqualTo("value 2");
	}

	@Test
	void whatCouldNotBeClearedIsNotReadAndIsClearedLater() {
		String key = UUID.randomUUID().toString();
		String other = UUID.randomUUID().toString();
		read("plain", key);
		read("plain", other);
		stoppable.gone = true;
		test.getCache("plain").evict(key);
		test.repeatFailedClears();
		stoppable.gone = false;

		assertThat(read("plain", key)).as("Redis is back with the old value").isEqualTo("value 3");
		assertThat(read("plain", key)).as("and nothing is stored over it").isEqualTo("value 4");
		assertThat(read("plain", other)).as("other entries are used").isEqualTo("value 2");
		assertThat(redis.opsForValue().get("s:matessa:v1:plain:" + key)).contains("value 1");

		test.repeatFailedClears();
		assertThat(redis.hasKey("s:matessa:v1:plain:" + key)).isFalse();
		assertThat(read("plain", key)).isEqualTo("value 5");
		assertThat(read("plain", key)).as("cached again").isEqualTo("value 5");
	}

	@Test
	void aGroupThatCouldNotBeClearedIsNotReadAndIsClearedLater() {
		read("list", "a" + run);
		read("detail", "b" + run);
		stoppable.gone = true;
		test.getCache("list").clear();
		stoppable.gone = false;
		assertThat(read("list", "a" + run)).isEqualTo("value 3");
		assertThat(read("detail", "b" + run)).as("the whole group").isEqualTo("value 4");
		test.repeatFailedClears();
		assertThat(read("list", "a" + run)).isEqualTo("value 5");
		assertThat(read("list", "a" + run)).isEqualTo("value 5");
	}

	@Test
	void hitsAndMissesAreMeasured() {
		Person person = people.customer();
		double hits = gets("hit");
		double misses = gets("miss");
		api.get("/api/users/me", person.accessToken());
		api.get("/api/users/me", person.accessToken());
		api.get("/api/users/me", person.accessToken());
		assertThat(gets("hit") - hits).isEqualTo(2);
		assertThat(gets("miss") - misses).isEqualTo(1);
	}

	private double gets(String result) {
		return meters.get("cache.gets").tag("cache", "me").tag("result", result).functionCounter().count();
	}

	@Test
	void fiftyMissesLoadOnce() throws Exception {
		String key = UUID.randomUUID().toString();
		try (ExecutorService pool = Executors.newFixedThreadPool(50)) {
			List<Future<String>> answers = new ArrayList<>();
			for (int i = 0; i < 50; i++) {
				answers.add(pool.submit(() -> test.getCache("plain").get(key, () -> {
					Thread.sleep(300);
					return "value " + loads.incrementAndGet();
				})));
			}
			for (Future<String> answer : answers) {
				assertThat(answer.get()).isEqualTo("value 1");
			}
		}
	}

	@Test
	void whatWasLoadedBeforeAClearIsNotKept() throws Exception {
		String key = UUID.randomUUID().toString();
		CountDownLatch loading = new CountDownLatch(1);
		CountDownLatch cleared = new CountDownLatch(1);
		try (ExecutorService pool = Executors.newSingleThreadExecutor()) {
			Future<String> reader = pool.submit(() -> test.getCache("plain").get(key, () -> {
				loading.countDown();
				cleared.await();
				return "old";
			}));
			loading.await();
			test.getCache("plain").evict(key);
			cleared.countDown();
			assertThat(reader.get()).isEqualTo("old");
		}
		assertThat(read("plain", key)).isEqualTo("value 1");
	}

	@Test
	void missingThingsAreRememberedBriefly() {
		String key = UUID.randomUUID().toString();
		for (int i = 0; i < 3; i++) {
			assertThat(test.getCache("plain").get(key, () -> {
				loads.incrementAndGet();
				return (String) null;
			})).isNull();
		}
		assertThat(loads).hasValue(1);
		assertThat(redis.getExpire("s:matessa:v1:plain:" + key)).isBetween(1L, 30L);
	}

	@Test
	void lifetimesVaryByTenPercent() {
		Set<Long> lifetimes = new TreeSet<>();
		for (int i = 0; i < 20; i++) {
			String key = UUID.randomUUID().toString();
			read("plain", key);
			lifetimes.add(redis.getExpire("s:matessa:v1:plain:" + key));
		}
		assertThat(lifetimes).hasSizeGreaterThan(3).allSatisfy(seconds -> assertThat(seconds).isBetween(530L, 661L));
	}

	@Test
	void aFailureIsTheServicesOwnAndIsNotCached() {
		String key = UUID.randomUUID().toString();
		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> test.getCache("plain").get(key, () -> {
			throw ApiException.notFound("no");
		}));
		assertThat(read("plain", key)).isEqualTo("value 1");
	}

	@Test
	void anUnreadableEntryIsAMiss() {
		String key = UUID.randomUUID().toString();
		redis.opsForValue().set("s:matessa:v1:plain:" + key, "{broken", Duration.ofMinutes(1));
		assertThat(read("plain", key)).isEqualTo("value 1");
	}

	@Test
	void theOwnProfileIsCachedPerAccountAndClearedByEveryChange() {
		Person one = people.manager();
		Person two = people.customer();
		Answer first = api.get("/api/users/me", one.accessToken());
		assertThat(redis.hasKey("s:matessa:v1:me:" + one.id())).isTrue();
		assertThat(api.get("/api/users/me", one.accessToken()).text()).as("same bytes from the cache").isEqualTo(first.text());
		assertThat(api.get("/api/users/me", two.accessToken()).json().get("id").asLong()).isEqualTo(two.id());

		api.put("/api/users/me", Map.of("firstName", "New", "lastName", "Name"), one.accessToken());
		assertThat(api.get("/api/users/me", one.accessToken()).json().get("firstName").asString()).isEqualTo("New");
		api.put("/api/users/me/password", Map.of("currentPassword", one.password(), "newPassword", People.password()), one.accessToken());
		assertThat(redis.hasKey("s:matessa:v1:me:" + one.id())).isFalse();
	}

	@Test
	void cachedProfilesHoldNoSecrets() {
		Person person = people.customer();
		api.get("/api/users/me", person.accessToken());
		assertThat(redis.opsForValue().get("s:matessa:v1:me:" + person.id())).doesNotContainIgnoringCase("hash")
			.doesNotContain(person.password());
	}

	private String read(String cache, String key) {
		return test.getCache(cache).get(key, () -> "value " + loads.incrementAndGet());
	}

}
