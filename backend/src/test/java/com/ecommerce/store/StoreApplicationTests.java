package com.ecommerce.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
	void runsOnTheDocumentedRedis() {
		var server = redis.execute(connection -> connection.serverCommands().info("server"), true);
		assertThat(server.getProperty("redis_version")).startsWith("7.");
	}

}
