package com.ecommerce.store.platform.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import com.ecommerce.fixtures.SampleEndpoints;
import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** What every endpoint shares (API-CONTRACT.md, section 1). */
@IntegrationTest
@Import(SampleEndpoints.class)
class WebConventionTests {

	private static final JsonMapper JSON = new JsonMapper();

	@LocalServerPort
	private int port;

	private RestTestClient client;

	@BeforeEach
	void createClient() {
		client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port)
			.defaultHeader("X-Tenant-ID", "matessa")
			.build();
	}

	@Test
	void answersPrintAsTheContractSays() {
		assertThat(get("/api/sample/output", 200)).isEqualTo("""
				{"id":1234567890123456,"missing":null,"price":499.00,"big":10000000,\
				"at":"2026-11-24T10:15:30Z","isDefault":true,"primary":false,"items":[]}""");
	}

	@Test
	void requestsMayLeaveFieldsOutOrAddUnknownOnes() {
		JsonNode answer = JSON.readTree(post("""
				{"name":"a","unknown":1,"isDefault":true,"price":12.5,"at":"2026-11-24T10:15:30Z"}""", 200));
		assertThat(answer.get("isDefault").asBoolean()).isTrue();
		assertThat(answer.get("displayOrder").asInt()).isZero();
		assertThat(answer.get("shippingAddress").isNull()).isTrue();
	}

	@Test
	void pagesHaveTheDocumentedShape() {
		assertThat(get("/api/sample/page?page=0&size=20", 200)).isEqualTo("""
				{"content":["size=20"],"page":{"size":20,"number":0,"totalElements":1,"totalPages":1}}""");
	}

	@ParameterizedTest
	@CsvSource({ "1000,1000", "5000,2000" })
	void pageSizeAllowsTheDashboardAndStopsAtTwoThousand(int asked, int given) {
		assertThat(get("/api/sample/page?size=" + asked, 200)).contains("\"size=" + given + "\"");
	}

	@Test
	void validationNamesEachFieldByItsPath() {
		JsonNode error = JSON.readTree(post("{\"name\":\" \",\"shippingAddress\":{\"postalCode\":\"\"}}", 400));
		assertThat(error.propertyNames()).containsExactly("timestamp", "status", "error", "message", "path",
				"fieldErrors");
		assertThat(error.get("fieldErrors").propertyNames()).containsExactlyInAnyOrder("name",
				"shippingAddress.postalCode");
		assertThat(error.get("path").asString()).isEqualTo("/api/sample/input");
		assertThat(error.get("error").asString()).isEqualTo("Bad Request");
		assertThat(Duration.between(Instant.parse(error.get("timestamp").asString()), Instant.now()).abs())
			.isLessThan(Duration.ofMinutes(1));
	}

	@ParameterizedTest
	@CsvSource(delimiter = '|', textBlock = """
			not-found | 404 | Cart item not found: 5
			stale     | 409 | This was changed by someone else. Reload and try again.
			duplicate | 409 | This was changed by someone else. Reload and try again.
			database  | 503 | The service is unavailable at the moment. Please try again.
			anything  | 500 | Something went wrong. Please try again.
			""")
	void failuresBecomeTheErrorBodyAndLeakNothing(String kind, int status, String message) {
		JsonNode error = JSON.readTree(get("/api/sample/fail/" + kind, status));
		assertThat(error.propertyNames()).containsExactly("timestamp", "status", "error", "message", "path");
		assertThat(error.get("status").asInt()).isEqualTo(status);
		assertThat(error.get("message").asString()).isEqualTo(message);
	}

	@Test
	void aCodeIsSentWhenTheClientMustReact() {
		JsonNode error = JSON.readTree(get("/api/sample/fail/code", 409));
		assertThat(error.get("code").asString()).isEqualTo("REQUEST_IN_PROGRESS");
	}

	@ParameterizedTest
	@CsvSource({ "/api/sample/limit?limit=101,400", "/api/sample/limit?limit=x,400", "/api/sample/limit,400",
			"/api/sample/nothing,404", "/api/sample/input,405", "/api/sample/broken-filter,500" })
	void springsOwnRefusalsHaveTheSameShape(String path, int status) {
		String body = get(path, status);
		JsonNode error = JSON.readTree(body);
		assertThat(error.get("status").asInt()).isEqualTo(status);
		assertThat(error.get("path").asString()).isEqualTo(path.replaceFirst("\\?.*", ""));
		assertThat(body).doesNotContainIgnoringCase("exception").doesNotContain("secret", "com.ecommerce");
	}

	@ParameterizedTest
	@CsvSource(delimiter = '|', textBlock = """
			{"name":                                  | application/json | 400
			{"name":"a","price":"not a number"}       | application/json | 400
			name=a                                    | text/plain       | 415
			""")
	void unreadableBodiesAreRefused(String body, String type, int status) {
		client.post()
			.uri("/api/sample/input")
			.contentType(MediaType.parseMediaType(type))
			.body(body)
			.exchange()
			.expectStatus()
			.isEqualTo(status);
	}

	@Test
	void aJsonBodyOver256KbIsTooLarge() {
		post("{\"name\":\"" + "a".repeat(300_000) + "\"}", 413);
	}

	@Test
	void everyAnswerHasItsOwnRequestId() {
		String first = requestId("/api/sample/output");
		assertThat(first).hasSize(36).isNotEqualTo("chosen-by-caller");
		assertThat(requestId("/api/sample/output")).isNotEqualTo(first);
		assertThat(requestId("/api/sample/broken-filter")).hasSize(36);
		assertThat(requestId("/api/products")).hasSize(36);
	}

	@Test
	void theRestIsClosedWithoutSessionsOrSignInPages() {
		EntityExchangeResult<String> result = client.get()
			.uri("/api/products")
			.accept(MediaType.TEXT_HTML)
			.exchange()
			.expectStatus()
			.isUnauthorized()
			.returnResult(String.class);
		assertThat(result.getResponseHeaders().toSingleValueMap()).doesNotContainKeys("Set-Cookie", "WWW-Authenticate");
		assertThat(JSON.readTree(result.getResponseBody()).get("message").asString()).isEqualTo("Sign in to continue.");
	}

	private String requestId(String path) {
		return client.get()
			.uri(path)
			.headers(headers -> headers.setAll(Map.of(RequestIdFilter.HEADER, "chosen-by-caller")))
			.exchange()
			.returnResult(String.class)
			.getResponseHeaders()
			.getFirst(RequestIdFilter.HEADER);
	}

	private String get(String path, int status) {
		return client.get().uri(path).exchange().expectStatus().isEqualTo(status).returnResult(String.class).getResponseBody();
	}

	private String post(String body, int status) {
		return client.post()
			.uri("/api/sample/input")
			.contentType(MediaType.APPLICATION_JSON)
			.body(body)
			.exchange()
			.expectStatus()
			.isEqualTo(status)
			.returnResult(String.class)
			.getResponseBody();
	}

}
