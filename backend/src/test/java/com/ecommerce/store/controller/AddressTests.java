package com.ecommerce.store.controller;

import static com.ecommerce.store.contract.Shape.assertShape;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;

@IntegrationTest
class AddressTests {

	private static final String PATH = "/api/users/me/addresses";

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Test
	void createsListsChangesAndDeletes() {
		Person person = people.customer();
		Answer created = api.post(PATH, body("12 MG Road", false), person.accessToken());
		assertThat(created.status()).isEqualTo(201);
		assertShape(created.json(), "AddressResponse");
		long id = created.json().get("id").asLong();

		Answer changed = api.put(PATH + "/" + id, body("14 MG Road", false), person.accessToken());
		assertThat(changed.status()).isEqualTo(200);
		assertShape(changed.json(), "AddressResponse");
		assertThat(changed.json().get("line1").asString()).isEqualTo("14 MG Road");

		Answer list = api.get(PATH, person.accessToken());
		assertShape(list.json(), "Page<AddressResponse>");
		assertThat(list.json().get("page").get("totalElements").asInt()).isEqualTo(1);

		Answer deleted = api.delete(PATH + "/" + id, person.accessToken());
		assertThat(deleted.status()).isEqualTo(204);
		assertThat(deleted.text()).isEmpty();
		assertThat(api.get(PATH, person.accessToken()).json().get("content")).isEmpty();
	}

	@Test
	void listsInTheOrderTheyWereAddedAndByPage() {
		Person person = people.customer();
		for (int i = 1; i <= 5; i++) {
			api.post(PATH, body("Street " + i, false), person.accessToken());
		}
		assertThat(lines(person, "")).containsExactly("Street 1", "Street 2", "Street 3", "Street 4", "Street 5");
		assertThat(lines(person, "?page=1&size=2")).containsExactly("Street 3", "Street 4");
		assertThat(lines(person, "?sort=createdAt,desc&size=1")).containsExactly("Street 5");
	}

	@ParameterizedTest
	@ValueSource(strings = { "id", "userId", "user.passwordHash", "nothing" })
	void sortsOnlyByWhatIsOffered(String field) {
		Answer answer = api.get(PATH + "?sort=" + field, people.customer().accessToken());
		assertThat(answer.status()).isEqualTo(400);
		assertThat(answer.message()).isEqualTo("Unknown sort field: " + field);
	}

	@Test
	void thereIsAtMostOneDefault() {
		Person person = people.customer();
		long first = api.post(PATH, body("first", true), person.accessToken()).json().get("id").asLong();
		api.post(PATH, body("second", true), person.accessToken());
		assertThat(defaults(person)).containsExactly("second");
		Answer again = api.put(PATH + "/" + first, body("first", true), person.accessToken());
		assertThat(again.json().get("isDefault").asBoolean()).isTrue();
		assertThat(defaults(person)).containsExactly("first");
		api.put(PATH + "/" + first, body("first", true), person.accessToken());
		assertThat(defaults(person)).as("saved again as default").containsExactly("first");
		api.put(PATH + "/" + first, body("first", false), person.accessToken());
		assertThat(defaults(person)).isEmpty();
	}

	@Test
	void tenDefaultsAtOnceLeaveOne() throws Exception {
		Person person = people.customer();
		try (ExecutorService pool = Executors.newFixedThreadPool(10)) {
			List<Future<Integer>> answers = new ArrayList<>();
			for (int i = 0; i < 10; i++) {
				answers.add(pool.submit(() -> api.post(PATH, body("x", true), person.accessToken()).status()));
			}
			for (Future<Integer> answer : answers) {
				assertThat(answer.get()).isEqualTo(201);
			}
		}
		assertThat(defaults(person)).hasSize(1);
	}

	@Test
	void someoneElsesAddressDoesNotExist() {
		Person owner = people.customer();
		long id = api.post(PATH, body("private", true), owner.accessToken()).json().get("id").asLong();
		for (Person other : List.of(people.customer(), people.admin())) {
			assertThat(api.put(PATH + "/" + id, body("mine", true), other.accessToken()).status()).isEqualTo(404);
			assertThat(api.delete(PATH + "/" + id, other.accessToken()).status()).isEqualTo(404);
			assertThat(api.get(PATH, other.accessToken()).json().get("content")).isEmpty();
		}
		assertThat(lines(owner, "")).containsExactly("private");
	}

	@ParameterizedTest
	@ValueSource(strings = { "line1", "city", "postalCode", "country", "type" })
	void requiredFieldsAreChecked(String field) {
		Map<String, Object> body = body("x", false);
		body.remove(field);
		Answer answer = api.post(PATH, body, people.customer().accessToken());
		assertThat(answer.status()).isEqualTo(400);
		assertThat(answer.json().get("fieldErrors").propertyNames()).containsExactly(field);
	}

	@Test
	void anUnknownTypeIsRefused() {
		Map<String, Object> body = body("x", false);
		body.put("type", "PALACE");
		assertThat(api.post(PATH, body, people.customer().accessToken()).status()).isEqualTo(400);
	}

	private List<String> lines(Person person, String query) {
		List<String> lines = new ArrayList<>();
		api.get(PATH + query, person.accessToken()).json().get("content").forEach(a -> lines.add(a.get("line1").asString()));
		return lines;
	}

	private List<String> defaults(Person person) {
		List<String> lines = new ArrayList<>();
		api.get(PATH, person.accessToken()).json().get("content").forEach(a -> {
			if (a.get("isDefault").asBoolean()) {
				lines.add(a.get("line1").asString());
			}
		});
		return lines;
	}

	private static Map<String, Object> body(String line1, boolean isDefault) {
		return new HashMap<>(Map.of("line1", line1, "city", "Bengaluru", "postalCode", "560001", "country", "India", "type",
				"HOME", "isDefault", isDefault));
	}

}
