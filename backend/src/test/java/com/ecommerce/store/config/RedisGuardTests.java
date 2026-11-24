package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;

import com.ecommerce.store.IntegrationTest;

/** Redis is unreachable here on purpose. */
@IntegrationTest
@TestPropertySource(properties = "spring.data.redis.port=1")
class RedisGuardTests {

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private RedisGuard guard;

	@Test
	void failuresAreSwallowedAndSoonNotEvenTried() {
		AtomicInteger asked = new AtomicInteger();
		for (int i = 0; i < 50; i++) {
			assertThat(guard.ask(() -> {
				asked.incrementAndGet();
				return redis.opsForValue().get("s:matessa:x");
			})).isEmpty();
		}
		assertThat(asked.get()).isLessThanOrEqualTo(10);
	}

}
