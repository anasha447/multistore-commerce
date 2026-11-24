package com.ecommerce.store.security;

import java.time.Clock;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.ecommerce.store.config.RedisGuard;
import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.repository.UserRepository;

/**
 * Shoppers disabled a moment ago, for as long as an access token of theirs can still be valid. Kept in
 * Redis, where every copy of the app sees it at once, and read from Postgres every few seconds, because
 * Redis may lose it. Being listed is a suspicion only: Postgres decides, see ActiveAccountValidator.
 */
@Component
@RequiredArgsConstructor
public class DeniedAccounts {

	/** A token's lifetime and the minute Spring allows for clocks that disagree. */
	private static final Duration LONG_ENOUGH = JwtService.LIFETIME.plusMinutes(2);

	private final Cache<Long, Boolean> disabledHere = Caffeine.newBuilder().expireAfterWrite(LONG_ENOUGH).build();

	private final UserRepository users;

	private final StringRedisTemplate redis;

	private final RedisGuard guard;

	private final StoreProperties store;

	private final Clock clock;

	private volatile Set<Long> disabledAnywhere = Set.of();

	public void deny(Long userId) {
		disabledHere.put(userId, true);
		guard.ask(() -> {
			redis.opsForValue().set(key(userId), "1", LONG_ENOUGH);
			return true;
		});
	}

	public void allow(Long userId) {
		disabledHere.invalidate(userId);
		guard.ask(() -> redis.delete(key(userId)));
	}

	public void readFromDatabase() {
		disabledAnywhere = Set.copyOf(users.findDisabledSince(clock.instant().minus(LONG_ENOUGH)));
	}

	/** Empty when Redis did not say. */
	Optional<Boolean> isSuspect(Long userId) {
		if (disabledHere.getIfPresent(userId) != null || disabledAnywhere.contains(userId)) {
			return Optional.of(true);
		}
		return guard.ask(() -> redis.hasKey(key(userId)));
	}

	private String key(Long userId) {
		return "s:" + store.id() + ":deny:" + userId;
	}

}
