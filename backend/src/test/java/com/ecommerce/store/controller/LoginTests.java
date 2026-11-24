package com.ecommerce.store.controller;

import static com.ecommerce.store.contract.Shape.assertShape;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.TestClock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

@IntegrationTest
class LoginTests {

	private static final String REFUSED = "Invalid email or password.";

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private TestClock clock;

	@Autowired
	private JdbcClient jdbc;

	@AfterEach
	void resetClock() {
		clock.reset();
	}

	@Test
	void registerCreatesACustomer() {
		String email = People.email();
		Answer answer = register("  " + email.toUpperCase() + " ", People.password());
		assertThat(answer.status()).as(answer.text()).isEqualTo(400);
		answer = register(email.toUpperCase(), People.password());
		assertThat(answer.status()).isEqualTo(201);
		assertShape(answer.json(), "UserResponse");
		assertThat(answer.json().get("email").asString()).isEqualTo(email);
		assertThat(answer.json().get("roles").toString()).isEqualTo("[\"CUSTOMER\"]");
		assertThat(answer.json().get("phone").isNull()).isTrue();
		assertThat(answer.text()).doesNotContainIgnoringCase("hash");
	}

	@Test
	void aKnownEmailIsAConflictInAnyCase() {
		Person person = people.customer();
		Answer answer = register(person.email().toUpperCase(), People.password());
		assertThat(answer.status()).isEqualTo(409);
		assertThat(answer.message()).isEqualTo("An account with this email already exists. Sign in instead.");
	}

	@Test
	void registeringTheSameEmailAtOnceCreatesOneAccount() throws Exception {
		String email = People.email();
		List<Integer> statuses = together(8, () -> register(email, People.password()).status());
		assertThat(statuses).containsOnly(201, 409).containsOnlyOnce(201);
	}

	@ParameterizedTest
	@CsvSource(delimiter = '|', nullValues = "null", textBlock = """
			email     | not-an-email
			email     | null
			password  | short
			password  | null
			firstName | ' '
			lastName  | null
			""")
	void registerChecksItsFields(String field, String value) {
		Map<String, Object> body = body(People.email(), People.password());
		body.put(field, value);
		Answer answer = api.post("/api/auth/register", body, null);
		assertThat(answer.status()).isEqualTo(400);
		assertThat(answer.json().get("fieldErrors").propertyNames()).containsExactly(field);
	}

	@Test
	void commonAndOverlongValuesAreRefused() {
		assertThat(register(People.email(), "password" + 1).status()).isEqualTo(400);
		Map<String, Object> body = body(People.email(), People.password());
		body.put("firstName", "a".repeat(300));
		assertThat(api.post("/api/auth/register", body, null).status()).isEqualTo(400);
	}

	@Test
	void aRoleCannotBeChosen() {
		Map<String, Object> body = body(People.email(), People.password());
		body.put("roles", List.of("ADMIN"));
		body.put("id", 1);
		Answer answer = api.post("/api/auth/register", body, null);
		assertThat(answer.json().get("roles").toString()).isEqualTo("[\"CUSTOMER\"]");
		assertThat(answer.json().get("id").asLong()).isGreaterThan(1);
	}

	@Test
	void loginAnswersTheTokens() {
		Person person = people.customer();
		Answer answer = login(person.email().toUpperCase(), person.password());
		assertThat(answer.status()).isEqualTo(200);
		assertShape(answer.json(), "TokenResponse");
		assertThat(answer.json().get("tokenType").asString()).isEqualTo("Bearer");
		assertThat(answer.json().get("expiresIn").asLong()).isEqualTo(900);
		assertThat(answer.json().get("refreshToken").asString()).matches("[A-Za-z0-9_-]{43}");
		assertThat(answer.headers().firstValue("Cache-Control")).hasValueSatisfying(v -> assertThat(v).contains("no-store"));
		assertThat(jdbc.sql("select count(*) from refresh_tokens where token_hash = ?")
			.param(answer.json().get("refreshToken").asString())
			.query(Integer.class)
			.single()).as("stored in the clear").isZero();
	}

	@Test
	void everyFailureLooksTheSame() {
		Person wrong = people.customer();
		Person disabled = people.customer();
		jdbc.sql("update users set enabled = false where id = ?").param(disabled.id()).update();
		Person locked = people.customer();
		lock(locked);
		List<Answer> failures = List.of(login(wrong.email(), People.password()), login(People.email(), People.password()),
				login(disabled.email(), disabled.password()), login(locked.email(), locked.password()));
		assertThat(failures).allSatisfy(answer -> {
			assertThat(answer.status()).isEqualTo(401);
			assertThat(answer.message()).isEqualTo(REFUSED);
			assertThat(answer.json().propertyNames()).containsExactly("timestamp", "status", "error", "message", "path");
		});
	}

	@Test
	void fiveFailuresLockForFifteenMinutes() {
		Person person = people.customer();
		for (int i = 0; i < 4; i++) {
			login(person.email(), People.password());
		}
		assertThat(login(person.email(), person.password()).status()).as("a success clears the counter").isEqualTo(200);
		lock(person);
		assertThat(login(person.email(), person.password()).status()).isEqualTo(401);
		clock.advance(Duration.ofMinutes(14));
		login(person.email(), People.password());
		assertThat(login(person.email(), person.password()).status()).isEqualTo(401);
		clock.advance(Duration.ofMinutes(1).plusSeconds(1));
		assertThat(login(person.email(), person.password()).status()).as("not extended").isEqualTo(200);
	}

	@Test
	void parallelGuessesCannotOutrunTheLock() throws Exception {
		Person person = people.customer();
		together(20, () -> login(person.email(), People.password()).status());
		assertThat(login(person.email(), person.password()).status()).isEqualTo(401);
		assertThat(jdbc.sql("select locked_until > now() from users where id = ?")
			.param(person.id())
			.query(Boolean.class)
			.single()).isTrue();
	}

	private void lock(Person person) {
		for (int i = 0; i < 5; i++) {
			login(person.email(), People.password());
		}
	}

	private Answer login(String email, String password) {
		return api.post("/api/auth/login", Map.of("email", email, "password", password), null);
	}

	private Answer register(String email, String password) {
		return api.post("/api/auth/register", body(email, password), null);
	}

	private static Map<String, Object> body(String email, String password) {
		return new HashMap<>(Map.of("email", email, "password", password, "firstName", "Asha", "lastName", "Rao"));
	}

	private static List<Integer> together(int threads, java.util.concurrent.Callable<Integer> call) throws Exception {
		try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
			List<Future<Integer>> futures = new ArrayList<>();
			for (int i = 0; i < threads; i++) {
				futures.add(pool.submit(call));
			}
			List<Integer> results = new ArrayList<>();
			for (Future<Integer> future : futures) {
				results.add(future.get());
			}
			return results;
		}
	}

}
