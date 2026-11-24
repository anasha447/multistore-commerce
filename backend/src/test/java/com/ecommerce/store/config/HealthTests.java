package com.ecommerce.store.config;

import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Redis is unreachable here on purpose: the app must still report itself ready. */
@IntegrationTest
@TestPropertySource(properties = "spring.data.redis.port=1")
class HealthTests {

	@LocalServerPort
	private int port;

	@Value("${local.management.port}")
	private int managementPort;

	@ParameterizedTest
	@ValueSource(strings = { "/actuator/health/liveness", "/actuator/health/readiness" })
	void probesAnswerOnThePrivatePort(String path) {
		RestTestClient.bindToServer()
			.baseUrl("http://localhost:" + managementPort)
			.build()
			.get()
			.uri(path)
			.exchange()
			.expectStatus()
			.isOk()
			.expectBody()
			.json("{\"status\":\"UP\"}");
	}

	@ParameterizedTest
	@CsvSource({ "/actuator/metrics,200", "/actuator/env,403", "/actuator/heapdump,403", "/actuator/beans,403" })
	void onlyHealthAndMetricsAreExposed(String path, int status) {
		RestTestClient.bindToServer()
			.baseUrl("http://localhost:" + managementPort)
			.build()
			.get()
			.uri(path)
			.exchange()
			.expectStatus()
			.value(actual -> {
				if (status == 200 ? actual != 200 : actual < 400) {
					throw new AssertionError(path + " answered " + actual);
				}
			});
	}

	@Test
	void nothingOfItIsOnThePublicPort() {
		RestTestClient.bindToServer()
			.baseUrl("http://localhost:" + port)
			.defaultHeader("X-Tenant-ID", "matessa")
			.build()
			.get()
			.uri("/actuator/health")
			.exchange()
			.expectStatus()
			.isUnauthorized();
	}

}
