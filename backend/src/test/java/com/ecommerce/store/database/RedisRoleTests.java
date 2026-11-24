package com.ecommerce.store.database;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.ecommerce.store.Containers;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.config.RedisGuard;

/** One Redis user per store, and no more commands than the app needs. */
@IntegrationTest
class RedisRoleTests {

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private RedisGuard guard;

	@Test
	void theAppUsesItsOwnKeys() {
		redis.opsForValue().set("s:matessa:test", "1", Duration.ofMinutes(1));
		assertThat(redis.opsForValue().increment("s:matessa:test")).isEqualTo(2);
		assertThat(redis.delete("s:matessa:test")).isTrue();
	}

	@ParameterizedTest
	@ValueSource(strings = { "s:adventure:test", "test", "s:matessa2:test" })
	void otherKeysAreRefused(String key) {
		assertThatExceptionOfType(RedisSystemException.class).isThrownBy(() -> redis.opsForValue().get(key))
			.withStackTraceContaining("NOPERM");
	}

	@Test
	void dangerousCommandsAreRefused() {
		for (RedisCallback<Object> command : List.<RedisCallback<Object>>of(c -> {
			c.serverCommands().flushAll();
			return null;
		}, c -> c.keyCommands().keys("*".getBytes()), c -> c.serverCommands().getConfig("*"),
				c -> c.serverCommands().info())) {
			assertThatExceptionOfType(RedisSystemException.class).isThrownBy(() -> redis.execute(command))
				.withStackTraceContaining("NOPERM");
		}
	}

	@Test
	void nobodyGetsInWithoutAName() {
		RedisStandaloneConfiguration anonymous = new RedisStandaloneConfiguration(Containers.REDIS.getHost(),
				Containers.REDIS.getFirstMappedPort());
		LettuceConnectionFactory factory = new LettuceConnectionFactory(anonymous);
		factory.afterPropertiesSet();
		factory.start();
		assertThatExceptionOfType(DataAccessException.class).isThrownBy(() -> factory.getConnection().stringCommands().get("x".getBytes()));
		factory.destroy();
	}

	@Test
	void aMissingAnswerIsNotAFailure() {
		assertThat(guard.ask(() -> redis.opsForValue().get("s:matessa:none"))).isEmpty();
		assertThat(guard.ask(() -> redis.opsForValue().get("s:adventure:none"))).as("a refused command").isEmpty();
	}

}
