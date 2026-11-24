package com.ecommerce.store.security;

import java.time.Duration;
import java.util.Optional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.ecommerce.store.config.RedisGuard;
import com.ecommerce.store.config.StoreProperties;

/** Disabled accounts, for as long as an access token of theirs can still be valid. */
@Component
@RequiredArgsConstructor
public class DeniedAccounts {

	/** A token's lifetime and the minute Spring allows for clocks that disagree. */
	private static final Duration LONG_ENOUGH = JwtService.LIFETIME.plusMinutes(2);

	/** Redis may lose an entry; this copy of the app does not. */
	private final Cache<Long, Boolean> here = Caffeine.newBuilder().expireAfterWrite(LONG_ENOUGH).build();

	private final StringRedisTemplate redis;

	private final RedisGuard guard;

	private final StoreProperties store;

	public void deny(Long userId) {
		here.put(userId, true);
		guard.ask(() -> {
			redis.opsForValue().set(key(userId), "1", LONG_ENOUGH);
			return true;
		});
	}

	public void allow(Long userId) {
		here.invalidate(userId);
		guard.ask(() -> redis.delete(key(userId)));
	}

	/** Empty when Redis did not say. */
	Optional<Boolean> isDenied(Long userId) {
		return (here.getIfPresent(userId) != null) ? Optional.of(true) : guard.ask(() -> redis.hasKey(key(userId)));
	}

	private String key(Long userId) {
		return "s:" + store.id() + ":deny:" + userId;
	}

}
