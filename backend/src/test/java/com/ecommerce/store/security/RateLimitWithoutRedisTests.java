package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;

import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.config.RedisGuard;
import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.exception.RateLimitException;
import com.ecommerce.store.model.enums.RateLimitRule;

@IntegrationTest
@TestPropertySource(properties = { "store.rate-limits=true", "store.requests-per-second=100000", "spring.data.redis.port=1" })
class RateLimitWithoutRedisTests extends RateLimitCases {

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private RedisGuard guard;

	@Test
	void severalCopiesTogetherAllowNoMore() {
		StoreProperties three = new StoreProperties("matessa", "", "", "", true, 100, 3);
		int allowed = 0;
		for (int copy = 0; copy < 3; copy++) {
			RateLimiter limiter = new RateLimiter(redis, guard, three, Clock.fixed(Instant.now(), ZoneOffset.UTC));
			for (int i = 0; i < 30; i++) {
				try {
					limiter.check(RateLimitRule.LOGIN, "203.0.113.7");
					allowed++;
				}
				catch (RateLimitException ex) {
					// refused
				}
			}
		}
		assertThat(allowed).isBetween(1, RateLimitRule.LOGIN.getLimit());
	}

}
