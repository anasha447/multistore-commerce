package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;

import com.ecommerce.store.Api;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;

/** Changes made in the database directly stand for those made by another copy of the app. */
@IntegrationTest
class DeniedAccountsTests {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private DeniedAccounts deniedAccounts;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private StringRedisTemplate redis;

	@AfterEach
	void forget() {
		deniedAccounts.readFromDatabase();
	}

	@Test
	void whatAnotherCopyDisabledIsKnownAfterTheNextLook() {
		Person person = people.customer();
		enabled(person, false, "now()");
		assertThat(status(person)).as("not known yet").isEqualTo(200);
		deniedAccounts.readFromDatabase();
		assertThat(status(person)).isEqualTo(401);
	}

	@Test
	void aRestartedRedisAndAppForgetNobody() {
		Person admin = people.admin();
		Person person = people.customer();
		api.put("/api/admin/users/" + person.id() + "/status", Map.of("enabled", false), admin.accessToken());
		redis.delete("s:matessa:deny:" + person.id());
		DeniedAccounts restarted = copy();
		assertThat(restarted.isSuspect(person.id())).contains(false);
		restarted.readFromDatabase();
		assertThat(restarted.isSuspect(person.id())).contains(true);
	}

	@Test
	void aLeftOverEntryKeepsNobodyOut() {
		Person person = people.customer();
		redis.opsForValue().set("s:matessa:deny:" + person.id(), "1", Duration.ofMinutes(1));
		assertThat(status(person)).isEqualTo(200);
	}

	@Test
	void beingEnabledByAnotherCopyCountsAtOnce() {
		Person admin = people.admin();
		Person person = people.customer();
		api.put("/api/admin/users/" + person.id() + "/status", Map.of("enabled", false), admin.accessToken());
		assertThat(status(person)).isEqualTo(401);
		enabled(person, true, "now()");
		assertThat(status(person)).isEqualTo(200);
	}

	@Test
	void thoseWhoseTokensHaveExpiredAreNotKept() {
		Person person = people.customer();
		enabled(person, false, "now() - interval '18 minutes'");
		deniedAccounts.readFromDatabase();
		assertThat(copy().isSuspect(person.id())).contains(false);
		assertThat(deniedAccounts.isSuspect(person.id())).contains(false);
	}

	private DeniedAccounts copy() {
		return context.getAutowireCapableBeanFactory().createBean(DeniedAccounts.class);
	}

	@Autowired
	private ApplicationContext context;

	private void enabled(Person person, boolean enabled, String when) {
		jdbc.sql("update users set enabled = ?, updated_at = " + when + " where id = ?").params(enabled, person.id()).update();
	}

	private int status(Person person) {
		return api.get("/api/users/me", person.accessToken()).status();
	}

}
