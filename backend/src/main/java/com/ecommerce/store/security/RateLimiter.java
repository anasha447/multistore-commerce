package com.ecommerce.store.security;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import com.ecommerce.store.config.RedisGuard;
import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.exception.RateLimitException;
import com.ecommerce.store.model.enums.RateLimitRule;

/**
 * Counts in Redis, so all copies of the app share one count, and in local memory, which is enough while
 * Redis is gone. Never unlimited.
 */
@Component
@RequiredArgsConstructor
public class RateLimiter {

	/** With the app's own loader: the one of the current thread may belong to a web context that closes. */
	private static final RedisScript<Long> SCRIPT = RedisScript
		.of(new ClassPathResource("scripts/rate-limit.lua", RateLimiter.class.getClassLoader()), Long.class);

	private final Cache<String, Integer> local = Caffeine.newBuilder()
		.maximumSize(100_000)
		.expireAfterWrite(Duration.ofDays(2))
		.build();

	private final StringRedisTemplate redis;

	private final RedisGuard guard;

	private final StoreProperties store;

	private final Clock clock;

	/** Counts one use, or refuses. */
	public void check(RateLimitRule rule, String who) {
		if (!allowed(rule, who, 1)) {
			long window = rule.getWindow().toMillis();
			throw new RateLimitException((window - clock.millis() % window + 999) / 1000);
		}
	}

	/** Looks without counting. */
	public void look(RateLimitRule rule, String who) {
		if (!allowed(rule, who, 0)) {
			throw new RateLimitException(60);
		}
	}

	public void count(RateLimitRule rule, String who) {
		allowed(rule, who, 1);
	}

	/** Protects this copy of the app from floods, so it is counted here only. */
	public boolean storeIsCalm() {
		return !store.rateLimits() || allowedLocally("store", store.requestsPerSecond(), 1000, 1);
	}

	private boolean allowed(RateLimitRule rule, String who, int cost) {
		if (!store.rateLimits()) {
			return true;
		}
		long window = rule.getWindow().toMillis();
		// addresses and emails are not written to Redis
		String name = "s:" + store.id() + ":rl:" + rule.name().toLowerCase(Locale.ROOT) + ":" + Hashes.sha256(who).substring(0, 32);
		long now = clock.millis();
		Optional<Long> answer = guard.ask(() -> redis.execute(SCRIPT, List.of(key(name, now / window), key(name, now / window - 1)),
				Integer.toString(rule.getLimit()), Double.toString(weight(now, window)), Integer.toString(cost),
				Long.toString(2 * window)));
		if (answer.isPresent() && answer.get() == 0) {
			return false;
		}
		// counted here as well: a hiccup of Redis, or an entry it drops, must not start the count again
		// the copies cannot add up what they counted while Redis is gone, so each allows its share
		int limit = answer.isPresent() ? rule.getLimit() : Math.max(1, rule.getLimit() / store.copies());
		return allowedLocally(name, limit, window, cost);
	}

	private synchronized boolean allowedLocally(String name, int limit, long window, int cost) {
		long now = clock.millis();
		Map<String, Integer> counts = local.asMap();
		String current = key(name, now / window);
		double used = counts.getOrDefault(current, 0)
				+ counts.getOrDefault(key(name, now / window - 1), 0) * weight(now, window);
		if (used >= limit) {
			return false;
		}
		if (cost > 0) {
			counts.merge(current, cost, Integer::sum);
		}
		return true;
	}

	private static String key(String name, long bucket) {
		return name + ":" + bucket;
	}

	private static double weight(long now, long window) {
		return 1 - (double) (now % window) / window;
	}

}
