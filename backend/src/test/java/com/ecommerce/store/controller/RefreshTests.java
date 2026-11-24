package com.ecommerce.store.controller;

import static com.ecommerce.store.contract.Shape.assertShape;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.TestClock;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

@IntegrationTest
class RefreshTests {

	private static final String UNKNOWN = "Invalid refresh token";

	private static final String OVER = "Refresh token expired or revoked";

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
	void exchangesATokenForANewPair() throws Exception {
		Person person = people.manager();
		Answer answer = refresh(person.refreshToken());
		assertThat(answer.status()).isEqualTo(200);
		assertShape(answer.json(), "TokenResponse");
		String next = answer.json().get("refreshToken").asString();
		assertThat(next).isNotEqualTo(person.refreshToken());
		SignedJWT access = SignedJWT.parse(answer.json().get("accessToken").asString());
		assertThat(access.getJWTClaimsSet().getSubject()).isEqualTo(Long.toString(person.id()));
		assertThat(access.getJWTClaimsSet().getStringListClaim("roles")).containsExactly("MANAGER");
		assertThat(refresh(next).status()).isEqualTo(200);
	}

	@Test
	void staffWhoMustChangeThePasswordStayWithoutRoles() throws Exception {
		Person person = people.newManager();
		String access = refresh(person.refreshToken()).json().get("accessToken").asString();
		assertThat(SignedJWT.parse(access).getJWTClaimsSet().getStringListClaim("roles")).isEmpty();
	}

	@Test
	void anUnknownTokenIsRefused() {
		refused(refresh("no-such-token"), UNKNOWN);
		assertThat(refresh(" ").status()).isEqualTo(400);
	}

	@Test
	void twoTabsDoNotEndTheSession() {
		Person person = people.customer();
		String next = refresh(person.refreshToken()).json().get("refreshToken").asString();
		refused(refresh(person.refreshToken()), OVER);
		clock.advance(Duration.ofSeconds(8));
		refused(refresh(person.refreshToken()), OVER);
		assertThat(refresh(next).status()).isEqualTo(200);
	}

	@Test
	void aTokenShownAgainLaterEndsTheWholeSignIn() {
		Person person = people.customer();
		String next = refresh(person.refreshToken()).json().get("refreshToken").asString();
		clock.advance(Duration.ofSeconds(11));
		refused(refresh(person.refreshToken()), OVER);
		refused(refresh(next), OVER);
	}

	@Test
	void otherSignInsOfTheAccountGoOn() {
		Person phone = people.customer();
		Person laptop = people.signIn(phone.email(), phone.password());
		refresh(phone.refreshToken());
		clock.advance(Duration.ofSeconds(11));
		refresh(phone.refreshToken());
		assertThat(refresh(laptop.refreshToken()).status()).isEqualTo(200);
	}

	@Test
	void livesSevenDaysFromItsOwnStart() {
		Person person = people.customer();
		clock.advance(Duration.ofDays(6));
		String next = refresh(person.refreshToken()).json().get("refreshToken").asString();
		clock.advance(Duration.ofDays(6));
		String last = refresh(next).json().get("refreshToken").asString();
		clock.advance(Duration.ofDays(7));
		refused(refresh(last), OVER);
	}

	@Test
	void aDisabledAccountCannotRefresh() {
		Person person = people.customer();
		jdbc.sql("update users set enabled = false where id = ?").param(person.id()).update();
		refused(refresh(person.refreshToken()), OVER);
	}

	@Test
	void logoutEndsTheSignInAndNothingElse() {
		Person phone = people.customer();
		Person laptop = people.signIn(phone.email(), phone.password());
		String next = refresh(phone.refreshToken()).json().get("refreshToken").asString();
		// any token of the sign-in will do, also an old one
		Answer answer = logout(phone.refreshToken());
		assertThat(answer.status()).isEqualTo(204);
		assertThat(answer.text()).isEmpty();
		refused(refresh(next), OVER);
		assertThat(refresh(laptop.refreshToken()).status()).isEqualTo(200);
	}

	@Test
	void logoutAcceptsUnknownTokens() {
		assertThat(logout("no-such-token").status()).isEqualTo(204);
	}

	@Test
	void twentyExchangesAtOnceGiveOnePair() throws Exception {
		Person person = people.customer();
		List<Answer> answers = together(Collections.nCopies(20, () -> refresh(person.refreshToken())));
		assertThat(answers).filteredOn(answer -> answer.status() == 200).hasSize(1);
		assertThat(answers).filteredOn(answer -> answer.status() == 401).hasSize(19);
		String next = answers.stream()
			.filter(answer -> answer.status() == 200)
			.findFirst()
			.orElseThrow()
			.json()
			.get("refreshToken")
			.asString();
		assertThat(refresh(next).status()).isEqualTo(200);
	}

	/** Whatever the order, no token of the sign-in may work after the logout has answered. */
	@Test
	void anExchangeCannotSlipPastALogout() throws Exception {
		for (int i = 0; i < 20; i++) {
			Person person = people.customer();
			List<Answer> answers = together(
					List.of(() -> refresh(person.refreshToken()), () -> logout(person.refreshToken())));
			if (answers.getFirst().status() == 200) {
				refused(refresh(answers.getFirst().json().get("refreshToken").asString()), OVER);
			}
			assertThat(jdbc.sql("select count(*) from refresh_tokens where user_id = ? and not revoked")
				.param(person.id())
				.query(Integer.class)
				.single()).isZero();
		}
	}

	private Answer refresh(String token) {
		return api.post("/api/auth/refresh", Map.of("refreshToken", token), null);
	}

	private Answer logout(String token) {
		return api.post("/api/auth/logout", Map.of("refreshToken", token), null);
	}

	private static void refused(Answer answer, String message) {
		assertThat(answer.status()).isEqualTo(401);
		assertThat(answer.message()).isEqualTo(message);
	}

	private static List<Answer> together(List<Callable<Answer>> calls) throws Exception {
		try (ExecutorService pool = Executors.newFixedThreadPool(calls.size())) {
			List<Answer> answers = new ArrayList<>();
			for (Future<Answer> future : pool.invokeAll(calls)) {
				answers.add(future.get());
			}
			return answers;
		}
	}

}
