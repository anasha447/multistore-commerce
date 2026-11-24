package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.ecommerce.fixtures.SampleEndpoints;
import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

@IntegrationTest
@Import(SampleEndpoints.class)
class StoreCheckTests {

	private final HttpClient client = HttpClient.newHttpClient();

	@LocalServerPort
	private int port;

	@Test
	void theRightStoreIsServed() throws Exception {
		assertThat(send("/api/sample/output", "matessa").statusCode()).isEqualTo(200);
	}

	@ParameterizedTest
	@NullSource
	@ValueSource(strings = { "adventure", "MATESSA", "matessa ,adventure", "" })
	void anyOtherStoreIsRefused(String store) throws Exception {
		HttpResponse<String> answer = send("/api/sample/output", store);
		assertThat(answer.statusCode()).isEqualTo(400);
		assertThat(answer.body()).contains("\"message\":\"Unknown store.\"", "\"path\":\"/api/sample/output\"");
		assertThat(answer.headers().firstValue("X-Request-Id")).isPresent();
	}

	@ParameterizedTest
	@CsvSource({ "/%61pi/sample/output", "/media/../api/sample/output", "/media/%2e%2e/api/sample/output",
			"//api/sample/output", "/api;x=1/sample/output", "/media;/../api/sample/output" })
	void aDisguisedPathIsNotServed(String path) throws Exception {
		assertThat(send(path, null).statusCode()).isGreaterThanOrEqualTo(400);
	}

	@Test
	void imagesNeedNoStoreHeader() throws Exception {
		assertThat(send("/media/matessa/x.webp", null).body()).doesNotContain("Unknown store");
	}

	private HttpResponse<String> send(String path, String store) throws Exception {
		HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
		if (store != null) {
			request.header("X-Tenant-ID", store);
		}
		return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

}
