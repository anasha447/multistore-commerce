package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import com.ecommerce.store.Api;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.SqlCounter;

/** Redis is unreachable here on purpose: everything still works, only slower. */
@IntegrationTest
@TestPropertySource(properties = { "spring.data.redis.port=1", "store.rate-limits=true", "store.requests-per-second=100000" })
class WithoutRedisTests {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private SqlCounter sql;

	@Test
	void everyEndpointBuiltSoFarAnswers() {
		Person person = people.customer();
		String token = person.accessToken();
		assertThat(api.get("/api/users/me", token).status()).isEqualTo(200);
		assertThat(api.put("/api/users/me", Map.of("firstName", "Mira", "lastName", "Das"), token).status()).isEqualTo(200);
		assertThat(api.get("/api/users/me", token).json().get("firstName").asString()).isEqualTo("Mira");

		Map<String, Object> body = Map.of("line1", "12 MG Road", "city", "Bengaluru", "postalCode", "560001", "country", "India",
				"type", "HOME", "isDefault", true);
		long id = api.post("/api/users/me/addresses", body, token).json().get("id").asLong();
		assertThat(api.get("/api/users/me/addresses", token).json().get("content")).hasSize(1);
		assertThat(api.put("/api/users/me/addresses/" + id, body, token).status()).isEqualTo(200);
		assertThat(api.delete("/api/users/me/addresses/" + id, token).status()).isEqualTo(204);

		assertThat(api.put("/api/users/me/password", Map.of("currentPassword", person.password(), "newPassword", People.password()),
				token).status()).isEqualTo(204);
		assertThat(api.post("/api/auth/logout", Map.of("refreshToken", person.refreshToken()), null).status()).isEqualTo(204);

		Person admin = people.admin();
		assertThat(api.get("/api/admin/users?size=1", admin.accessToken()).status()).isEqualTo(200);
		assertThat(api.get("/api/admin/users/" + person.id(), admin.accessToken()).status()).isEqualTo(200);
		assertThat(api.post("/api/admin/users", Map.of("email", People.email(), "password", People.password(), "firstName", "A",
				"lastName", "B"), admin.accessToken()).status()).isEqualTo(201);
	}

	@Test
	void disablingAShopperTakesEffectAtOnce() {
		Person admin = people.admin();
		Person person = people.customer();
		assertThat(api.get("/api/users/me", person.accessToken()).status()).isEqualTo(200);
		api.put("/api/admin/users/" + person.id() + "/status", Map.of("enabled", false), admin.accessToken());
		assertThat(api.get("/api/users/me", person.accessToken()).status()).isEqualTo(401);
	}

	@Test
	void readsComeFromPostgresWithoutWaitingForRedis() {
		Person person = people.customer();
		long start = System.nanoTime();
		for (int i = 0; i < 50; i++) {
			assertThat(sql.during(() -> api.get("/api/users/me", person.accessToken()))).isPositive();
		}
		assertThat(Duration.ofNanos(System.nanoTime() - start)).isLessThan(Duration.ofSeconds(10));
	}

}
