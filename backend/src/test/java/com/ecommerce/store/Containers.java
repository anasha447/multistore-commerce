package com.ecommerce.store;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/**
 * One Postgres and one Redis for the whole test run. They are not beans, so closing a Spring
 * context never stops them under another one. Postgres is set up by the production script, with
 * two stores, so tests run with the roles production has.
 */
public class Containers implements ApplicationContextInitializer<ConfigurableApplicationContext> {

	private static final String PASSWORD = UUID.randomUUID().toString();

	// durability is pointless for a database that lives for one run
	private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
		.withEnv(Map.of("STORES", "matessa adventure", "MATESSA_OWNER_PASSWORD", PASSWORD, "MATESSA_APP_PASSWORD",
				PASSWORD, "MATESSA_BACKUP_PASSWORD", PASSWORD, "ADVENTURE_OWNER_PASSWORD", PASSWORD,
				"ADVENTURE_APP_PASSWORD", PASSWORD, "ADVENTURE_BACKUP_PASSWORD", PASSWORD))
		.withCopyFileToContainer(MountableFile.forHostPath("../deploy/postgres/init.sh", 0755),
				"/docker-entrypoint-initdb.d/10-stores.sh")
		.withCommand("postgres", "-c", "fsync=off", "-c", "full_page_writes=off", "-c", "synchronous_commit=off", "-c",
				"max_connections=100");

	private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

	static {
		Startables.deepStart(POSTGRES, REDIS).join();
	}

	/** A connection outside the app's pool, as any role, to any store's database. */
	public static Connection connect(String database, String role) throws SQLException {
		return DriverManager.getConnection(url(database), role, PASSWORD);
	}

	private static String url(String database) {
		return "jdbc:postgresql://%s:%d/%s?currentSchema=shop".formatted(POSTGRES.getHost(),
				POSTGRES.getMappedPort(PostgreSQLContainer.POSTGRESQL_PORT), database);
	}

	@Override
	public void initialize(ConfigurableApplicationContext context) {
		TestPropertyValues
			.of("STORE_ID=matessa", "MANAGEMENT_PORT=0", "DB_URL=" + url("matessa"), "DB_APP_USER=matessa_app", "DB_APP_PASSWORD=" + PASSWORD,
					"DB_OWNER_USER=matessa_owner", "DB_OWNER_PASSWORD=" + PASSWORD, "REDIS_HOST=" + REDIS.getHost(),
					"REDIS_PORT=" + REDIS.getFirstMappedPort())
			.applyTo(context);
	}

}
