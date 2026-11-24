package com.ecommerce.store;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * One Postgres and one Redis for the whole test run. They are not beans, so closing a Spring
 * context never stops them under another one.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	// durability is pointless for a database that lives for one run
	public static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
		.withCommand("postgres", "-c", "fsync=off", "-c", "full_page_writes=off", "-c", "synchronous_commit=off", "-c",
				"max_connections=60");

	public static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

	static {
		Startables.deepStart(POSTGRES, REDIS).join();
	}

	@Bean
	DynamicPropertyRegistrar containerProperties() {
		return registry -> {
			registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
			registry.add("spring.datasource.username", POSTGRES::getUsername);
			registry.add("spring.datasource.password", POSTGRES::getPassword);
			registry.add("spring.data.redis.host", REDIS::getHost);
			registry.add("spring.data.redis.port", REDIS::getFirstMappedPort);
		};
	}

}
