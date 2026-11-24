package com.ecommerce.store.controller;

import static com.ecommerce.store.contract.Shape.assertShape;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.model.BaseEntity;

@IntegrationTest
class AdminUserTests {

	private static final String PATH = "/api/admin/users";

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Test
	void createsAManagerWhoMustChangeThePassword() {
		Person admin = people.admin();
		String email = People.email();
		String password = People.password();
		Answer answer = create(admin, email.toUpperCase(), password);
		assertThat(answer.status()).isEqualTo(201);
		assertShape(answer.json(), "AdminUserResponse");
		assertThat(answer.json().get("email").asString()).isEqualTo(email);
		assertThat(answer.json().get("roles").toString()).isEqualTo("[\"MANAGER\"]");
		assertThat(answer.json().get("mustChangePassword").asBoolean()).isTrue();
		assertThat(answer.json().get("createdAt").isNull()).isFalse();
		assertThat(answer.text()).doesNotContain(password).doesNotContainIgnoringCase("hash");

		Person manager = people.signIn(email, password);
		assertThat(api.get("/api/orders/admin", manager.accessToken()).status()).isEqualTo(403);
	}

	@Test
	void aKnownEmailIsAConflict() {
		Answer answer = create(people.admin(), people.customer().email(), People.password());
		assertThat(answer.status()).isEqualTo(409);
		assertThat(answer.message()).isEqualTo("An account with this email already exists.");
	}

	@Test
	void anAdminCannotBeCreatedThisWay() {
		Map<String, Object> body = body(People.email(), People.password());
		body.put("roles", List.of("ADMIN"));
		body.put("mustChangePassword", false);
		Answer answer = api.post(PATH, body, people.admin().accessToken());
		assertThat(answer.json().get("roles").toString()).isEqualTo("[\"MANAGER\"]");
		assertThat(answer.json().get("mustChangePassword").asBoolean()).isTrue();
	}

	@Test
	void commonPasswordsAreRefused() {
		assertThat(create(people.admin(), People.email(), "password" + 1).status()).isEqualTo(400);
	}

	@Test
	void listsWithBothFilters() {
		Person admin = people.admin();
		Person customer = people.customer();
		Person off = people.manager();
		disable(admin, off);
		assertThat(ids(admin, "?size=2000")).contains(admin.id(), customer.id(), off.id()).doesNotHaveDuplicates();
		assertThat(ids(admin, "?role=ADMIN&size=2000")).contains(admin.id()).doesNotContain(customer.id(), off.id());
		assertThat(ids(admin, "?role=MANAGER&enabled=false&size=2000")).contains(off.id()).doesNotContain(admin.id());
		assertThat(ids(admin, "?enabled=true&size=2000")).contains(customer.id()).doesNotContain(off.id());
		Answer page = api.get(PATH + "?size=1", admin.accessToken());
		assertShape(page.json(), "Page<AdminUserResponse>");
		assertThat(page.json().get("content")).hasSize(1);
		assertThat(api.get(PATH + "?role=OWNER", admin.accessToken()).status()).isEqualTo(400);
		assertThat(api.get(PATH + "?sort=passwordHash", admin.accessToken()).status()).isEqualTo(400);
	}

	@Test
	void readsOneAccount() {
		Person admin = people.admin();
		Person customer = people.customer();
		Answer answer = api.get(PATH + "/" + customer.id(), admin.accessToken());
		assertThat(answer.status()).isEqualTo(200);
		assertShape(answer.json(), "AdminUserResponse");
		assertThat(api.get(PATH + "/" + BaseEntity.newId(), admin.accessToken()).status()).isEqualTo(404);
		assertThat(api.get(PATH + "/abc", admin.accessToken()).status()).isEqualTo(400);
	}

	@Test
	void disablingTakesEffectAtOnceAndCanBeUndone() {
		Person admin = people.admin();
		Person manager = people.manager();
		assertThat(api.get("/api/users/me", manager.accessToken()).status()).isEqualTo(200);

		Answer answer = disable(admin, manager);
		assertThat(answer.status()).isEqualTo(200);
		assertShape(answer.json(), "AdminUserResponse");
		assertThat(answer.json().get("enabled").asBoolean()).isFalse();
		assertThat(api.get("/api/users/me", manager.accessToken()).status()).isEqualTo(401);
		assertThat(api.get("/api/categories", manager.accessToken()).status()).as("also on public paths").isEqualTo(401);
		assertThat(refresh(manager)).isEqualTo(401);
		assertThat(login(manager)).isEqualTo(401);

		api.put(PATH + "/" + manager.id() + "/status", Map.of("enabled", true), admin.accessToken());
		assertThat(refresh(manager)).as("old sign-ins stay ended").isEqualTo(401);
		assertThat(login(manager)).isEqualTo(200);
	}

	@Test
	void aShopperIsOutAtOnceToo() {
		Person admin = people.admin();
		Person customer = people.customer();
		assertThat(api.get("/api/users/me", customer.accessToken()).status()).isEqualTo(200);
		disable(admin, customer);
		assertThat(api.get("/api/users/me", customer.accessToken()).status()).isEqualTo(401);
		api.put(PATH + "/" + customer.id() + "/status", Map.of("enabled", true), admin.accessToken());
		assertThat(api.get("/api/users/me", customer.accessToken()).status()).isEqualTo(200);
	}

	@Test
	void anAdminCannotLockThemselfOut() {
		Person admin = people.admin();
		Answer answer = disable(admin, admin);
		assertThat(answer.status()).isEqualTo(409);
		assertThat(answer.message()).isEqualTo("You cannot change the status of your own account");
	}

	@Test
	void theStatusIsRequiredAndTheAccountMustExist() {
		Person admin = people.admin();
		String path = PATH + "/" + people.customer().id() + "/status";
		assertThat(api.put(path, Map.of(), admin.accessToken()).status()).isEqualTo(400);
		path = PATH + "/" + BaseEntity.newId() + "/status";
		assertThat(api.put(path, Map.of("enabled", false), admin.accessToken()).status()).isEqualTo(404);
	}

	private Answer create(Person admin, String email, String password) {
		return api.post(PATH, body(email, password), admin.accessToken());
	}

	private Answer disable(Person admin, Person person) {
		return api.put(PATH + "/" + person.id() + "/status", Map.of("enabled", false), admin.accessToken());
	}

	private int refresh(Person person) {
		return api.post("/api/auth/refresh", Map.of("refreshToken", person.refreshToken()), null).status();
	}

	private int login(Person person) {
		return api.post("/api/auth/login", Map.of("email", person.email(), "password", person.password()), null).status();
	}

	private List<Long> ids(Person admin, String query) {
		List<Long> ids = new ArrayList<>();
		api.get(PATH + query, admin.accessToken()).json().get("content").forEach(user -> ids.add(user.get("id").asLong()));
		return ids;
	}

	private static Map<String, Object> body(String email, String password) {
		return new HashMap<>(Map.of("email", email, "password", password, "firstName", "Dev", "lastName", "Nair"));
	}

}
