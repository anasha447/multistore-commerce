package com.ecommerce.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnectionCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;

@IntegrationTest
class StoreApplicationTests {

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private StringRedisTemplate redis;

	@Test
	void runsOnTheDocumentedPostgres() {
		assertThat(jdbc.sql("show server_version").query(String.class).single()).startsWith("17.");
	}

	@Test
	void reachesRedis() {
		assertThat(redis.execute(RedisConnectionCommands::ping, true)).isEqualTo("PONG");
	}

}
