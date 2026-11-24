package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.ecommerce.store.Api;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.SqlCounter;
import com.ecommerce.store.security.DeniedAccounts;

/** The second read of a cached answer sends nothing to Postgres (CACHING.md). */
@IntegrationTest
class NoDatabaseOnGetTests {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private SqlCounter sql;

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private DeniedAccounts deniedAccounts;

	@ParameterizedTest
	@ValueSource(strings = { "/api/users/me", "/api/users/me/addresses", "/api/users/me/addresses?page=1&size=5&sort=createdAt,desc" })
	void aShoppersSecondReadNeedsNoStatement(String path) {
		Person person = people.customer();
		assertThat(read(path, person)).as("first").isPositive();
		assertThat(read(path, person)).as("second").isZero();
	}

	@Test
	void afterAChangeTheNextReadIsFreshAndTheOneAfterIsFree() {
		Person person = people.customer();
		read("/api/users/me", person);
		api.put("/api/users/me", Map.of("firstName", "Mira", "lastName", "Das"), person.accessToken());
		assertThat(api.get("/api/users/me", person.accessToken()).json().get("firstName").asString()).isEqualTo("Mira");
		assertThat(read("/api/users/me", person)).isZero();

		String addresses = "/api/users/me/addresses";
		read(addresses, person);
		Map<String, Object> body = Map.of("line1", "12 MG Road", "city", "Bengaluru", "postalCode", "560001", "country", "India",
				"type", "HOME");
		long id = api.post(addresses, body, person.accessToken()).json().get("id").asLong();
		assertThat(api.get(addresses, person.accessToken()).json().get("content")).hasSize(1);
		assertThat(read(addresses, person)).isZero();
		api.delete(addresses + "/" + id, person.accessToken());
		assertThat(api.get(addresses, person.accessToken()).json().get("content")).isEmpty();
	}

	@Test
	void aChangeThatFailsClearsNothing() {
		Person person = people.customer();
		read("/api/users/me", person);
		assertThat(api.put("/api/users/me", Map.of("firstName", " "), person.accessToken()).status()).isEqualTo(400);
		assertThat(read("/api/users/me", person)).isZero();
	}

	/** One look at the account, every time, so disabling staff never waits for a cache. */
	@Test
	void staffAreLookedUpOnEveryRequest() {
		Person manager = people.manager();
		read("/api/users/me", manager);
		assertThat(read("/api/users/me", manager)).isEqualTo(1);
	}

	@Test
	void aDisabledShopperStaysOutWhenRedisLosesTheEntry() {
		Person admin = people.admin();
		Person person = people.customer();
		api.put("/api/admin/users/" + person.id() + "/status", Map.of("enabled", false), admin.accessToken());
		assertThat(redis.delete("s:matessa:deny:" + person.id())).isTrue();
		assertThat(api.get("/api/users/me", person.accessToken()).status()).isEqualTo(401);
	}

	/** volatile-lru may remove what has a lifetime, so only what may be lost has one. */
	@Test
	void whatMustStayHasNoLifetimeAndWhatMayGoHasOne() {
		Person person = people.customer();
		read("/api/users/me", person);
		deniedAccounts.deny(person.id());
		assertThat(redis.getExpire("s:matessa:v1:me:" + person.id())).isPositive();
		assertThat(redis.getExpire("s:matessa:deny:" + person.id())).isBetween(960L, 1020L);
		deniedAccounts.allow(person.id());
	}

	private int read(String path, Person person) {
		return sql.during(() -> assertThat(api.get(path, person.accessToken()).status()).isEqualTo(200));
	}

}
