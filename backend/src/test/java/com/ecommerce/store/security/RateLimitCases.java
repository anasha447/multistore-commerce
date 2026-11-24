package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Supplier;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.TestClock;
import com.ecommerce.store.model.BaseEntity;

/** The same expectations with Redis and without it. */
abstract class RateLimitCases {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private TestClock clock;

	/** Starts every test at the beginning of a minute and of a quarter of an hour, so windows do not move under it. */
	@BeforeEach
	void startOfAWindow() {
		clock.reset();
		clock.advance(Duration.ofMillis(900_000 - clock.millis() % 900_000 + 1000));
	}

	@AfterEach
	void resetClock() {
		clock.reset();
	}

	@Test
	void loginsAreCountedByAddress() {
		String here = Api.address();
		assertThat(times(20, () -> login(here, People.email()))).containsOnly(401);
		Answer answer = login(here, People.email());
		assertThat(answer.status()).isEqualTo(429);
		assertThat(answer.message()).isEqualTo("Too many requests. Please try again in a moment.");
		assertThat(answer.headers().firstValueAsLong("Retry-After").orElseThrow()).isBetween(1L, 60L);
		assertThat(login(Api.address(), People.email()).status()).as("elsewhere").isEqualTo(401);
		clock.advance(Duration.ofMinutes(2));
		assertThat(login(here, People.email()).status()).as("later").isEqualTo(401);
	}

	@Test
	void theWindowSlides() {
		String here = Api.address();
		clock.advance(Duration.ofSeconds(50));
		times(20, () -> login(here, People.email()));
		clock.advance(Duration.ofSeconds(15));
		int allowed = 0;
		while (login(here, People.email()).status() == 401) {
			allowed++;
		}
		assertThat(allowed).as("a new minute is no new allowance").isBetween(1, 5);
	}

	@Test
	void loginsAreCountedByAccountFromAnywhere() {
		String email = People.email();
		assertThat(times(10, () -> login(Api.address(), email))).containsOnly(401);
		assertThat(login(Api.address(), email.toUpperCase()).status()).isEqualTo(429);
	}

	@Test
	void pagesRenderedByTheStorefrontAreNotCountedByAddress() {
		assertThat(times(30, () -> login("", People.email()))).containsOnly(401);
	}

	@Test
	void registeringIsCountedByTheMinuteAndByTheDay() {
		String here = Api.address();
		for (int minute = 0; minute < 6; minute++) {
			assertThat(times(5, () -> register(here))).containsOnly(201);
			assertThat(register(here).status()).isEqualTo(429);
			clock.advance(Duration.ofMinutes(2));
		}
		assertThat(register(here).status()).as("thirty a day").isEqualTo(429);
	}

	/** They all come from the storefront. In the old system one shopper could sign everybody out. */
	@Test
	void refreshingIsCountedByTokenOnly() {
		for (int i = 0; i < 40; i++) {
			assertThat(refresh(people.customer().refreshToken())).isEqualTo(200);
		}
		String token = People.password();
		assertThat(times(10, () -> refresh(token))).containsOnly(401);
		assertThat(refresh(token)).isEqualTo(429);
	}

	@Test
	void passwordChangesAreCountedByAccount() {
		Person person = people.customer();
		assertThat(times(5, () -> change(person))).containsOnly(400);
		assertThat(change(person).status()).isEqualTo(429);
		assertThat(change(people.customer()).status()).isEqualTo(400);
	}

	@Test
	void otherWritesAreCountedByAccount() {
		Person person = people.customer();
		assertThat(times(120, () -> rename(person))).containsOnly(200);
		assertThat(rename(person).status()).isEqualTo(429);
		assertThat(api.get("/api/users/me", person.accessToken()).status()).as("reading").isEqualTo(200);
	}

	@Test
	void guessingIdsIsSlowedDown() {
		Person person = people.customer();
		assertThat(times(60, () -> api.delete("/api/users/me/addresses/" + BaseEntity.newId(), person.accessToken()))).containsOnly(404);
		assertThat(times(60, () -> api.get("/api/orders/" + BaseEntity.newId(), person.accessToken()))).containsOnly(404);
		assertThat(api.get("/api/users/me", person.accessToken()).status()).isEqualTo(429);
		assertThat(api.get("/api/users/me", people.customer().accessToken()).status()).isEqualTo(200);
	}

	@Test
	void manyAtOnceDoNotSlipThrough() throws Exception {
		Person person = people.customer();
		try (ExecutorService pool = Executors.newFixedThreadPool(20)) {
			List<Future<Integer>> answers = new ArrayList<>();
			for (int i = 0; i < 40; i++) {
				answers.add(pool.submit(() -> change(person).status()));
			}
			List<Integer> statuses = new ArrayList<>();
			for (Future<Integer> answer : answers) {
				statuses.add(answer.get());
			}
			assertThat(statuses).filteredOn(status -> status == 400).hasSize(5);
		}
	}

	private Answer login(String address, String email) {
		return api.send("POST", "/api/auth/login", Map.of("email", email, "password", People.password()), null,
				Map.of("X-Forwarded-For", address));
	}

	private Answer register(String address) {
		return api.send("POST", "/api/auth/register", Map.of("email", People.email(), "password", People.password(), "firstName",
				"A", "lastName", "B"), null, Map.of("X-Forwarded-For", address));
	}

	private int refresh(String token) {
		return api.send("POST", "/api/auth/refresh", Map.of("refreshToken", token), null, Map.of("X-Forwarded-For", "")).status();
	}

	private Answer change(Person person) {
		return api.put("/api/users/me/password", Map.of("currentPassword", People.password(), "newPassword", People.password()),
				person.accessToken());
	}

	private Answer rename(Person person) {
		return api.put("/api/users/me", Map.of("firstName", "A", "lastName", "B"), person.accessToken());
	}

	private static Set<Integer> times(int count, Supplier<?> call) {
		Set<Integer> statuses = new TreeSet<>();
		for (int i = 0; i < count; i++) {
			Object answer = call.get();
			statuses.add((answer instanceof Answer a) ? a.status() : (Integer) answer);
		}
		return statuses;
	}

}
