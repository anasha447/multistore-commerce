package com.ecommerce.store.controller;

import static com.ecommerce.store.contract.Shape.assertShape;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;

@IntegrationTest
class UserTests {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Test
	void readsAndChangesTheOwnProfile() {
		Person person = people.customer();
		Answer me = api.get("/api/users/me", person.accessToken());
		assertThat(me.status()).isEqualTo(200);
		assertShape(me.json(), "UserResponse");
		assertThat(me.json().get("id").asLong()).isEqualTo(person.id());

		Answer changed = api.put("/api/users/me", Map.of("firstName", "Mira", "lastName", "Das", "phone", "98450 12345",
				"email", "other@example.com", "roles", List.of("ADMIN")), person.accessToken());
		assertThat(changed.status()).isEqualTo(200);
		assertShape(changed.json(), "UserResponse");
		assertThat(changed.json().get("firstName").asString()).isEqualTo("Mira");
		assertThat(changed.json().get("email").asString()).isEqualTo(person.email());
		assertThat(changed.json().get("roles").toString()).isEqualTo("[\"CUSTOMER\"]");
		assertThat(api.get("/api/users/me", person.accessToken()).json()).isEqualTo(changed.json());
	}

	@Test
	void theProfileIsValidated() {
		Person person = people.customer();
		Answer answer = api.put("/api/users/me", Map.of("firstName", " ", "lastName", "a".repeat(256)), person.accessToken());
		assertThat(answer.status()).isEqualTo(400);
		assertThat(answer.json().get("fieldErrors").propertyNames()).containsExactlyInAnyOrder("firstName", "lastName");
	}

	/** The storefront sends staff to their first password change by these two fields. */
	@Test
	void staffWhoMustChangeThePasswordStillSeeTheirRole() {
		Answer me = api.get("/api/users/me", people.newManager().accessToken());
		assertThat(me.json().get("mustChangePassword").asBoolean()).isTrue();
		assertThat(me.json().get("roles").toString()).isEqualTo("[\"MANAGER\"]");
	}

	@Test
	void changingThePasswordEndsEverySignIn() {
		Person phone = people.newManager();
		Person laptop = people.signIn(phone.email(), phone.password());
		String next = People.password();
		assertThat(change(phone, phone.password(), next).status()).isEqualTo(204);
		for (Person session : List.of(phone, laptop)) {
			assertThat(api.post("/api/auth/refresh", Map.of("refreshToken", session.refreshToken()), null).status())
				.isEqualTo(401);
		}
		assertThat(login(phone.email(), phone.password())).isEqualTo(401);
		Person again = people.signIn(phone.email(), next);
		assertThat(api.get("/api/users/me", again.accessToken()).json().get("mustChangePassword").asBoolean()).isFalse();
		// roles are back
		assertThat(api.get("/api/orders/admin", again.accessToken()).status()).isNotEqualTo(403);
	}

	@Test
	void aWrongCurrentPasswordChangesNothing() {
		Person person = people.customer();
		Answer answer = change(person, People.password(), People.password());
		assertThat(answer.status()).isEqualTo(400);
		assertThat(answer.message()).isEqualTo("Current password is incorrect");
		assertThat(login(person.email(), person.password())).isEqualTo(200);
	}

	@Test
	void aNewPasswordFollowsTheRules() {
		Person person = people.customer();
		assertThat(change(person, person.password(), "short").status()).isEqualTo(400);
		assertThat(change(person, person.password(), "password" + 1).status()).isEqualTo(400);
		assertThat(login(person.email(), person.password())).isEqualTo(200);
	}

	private Answer change(Person person, String current, String next) {
		return api.put("/api/users/me/password", Map.of("currentPassword", current, "newPassword", next),
				person.accessToken());
	}

	private int login(String email, String password) {
		return api.post("/api/auth/login", Map.of("email", email, "password", password), null).status();
	}

}
