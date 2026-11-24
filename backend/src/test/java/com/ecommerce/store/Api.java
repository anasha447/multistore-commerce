package com.ecommerce.store;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.util.Map;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Calls the app over HTTP the way the storefront's server does. */
public class Api {

	private static final JsonMapper JSON = new JsonMapper();

	private final HttpClient client = HttpClient.newHttpClient();

	private final Environment environment;

	Api(Environment environment) {
		this.environment = environment;
	}

	public record Answer(int status, String text, HttpHeaders headers) {

		public JsonNode json() {
			return JSON.readTree(text);
		}

		public String message() {
			return json().get("message").asString();
		}

	}

	public Answer get(String path, String token) {
		return send("GET", path, null, token);
	}

	public Answer post(String path, Object body, String token) {
		return send("POST", path, body, token);
	}

	public Answer put(String path, Object body, String token) {
		return send("PUT", path, body, token);
	}

	public Answer delete(String path, String token) {
		return send("DELETE", path, null, token);
	}

	public Answer send(String method, String path, Object body, String token) {
		return send(method, path, body, token, Map.of());
	}

	public Answer send(String method, String path, Object body, String token, Map<String, String> headers) {
		HttpRequest.Builder request = HttpRequest
			.newBuilder(URI.create("http://localhost:" + environment.getProperty("local.server.port") + path))
			.header("X-Tenant-ID", "matessa")
			.method(method, (body != null) ? BodyPublishers.ofString(JSON.writeValueAsString(body)) : BodyPublishers.noBody());
		if (body != null) {
			request.header("Content-Type", "application/json");
		}
		if (token != null) {
			request.header("Authorization", "Bearer " + token);
		}
		headers.forEach(request::header);
		try {
			HttpResponse<String> response = client.send(request.build(), HttpResponse.BodyHandlers.ofString());
			return new Answer(response.statusCode(), response.body(), response.headers());
		}
		catch (IOException ex) {
			throw new IllegalStateException(ex);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException(ex);
		}
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class Configuration {

		@Bean
		Api api(Environment environment) {
			return new Api(environment);
		}

	}

}
