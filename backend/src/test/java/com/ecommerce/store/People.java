package com.ecommerce.store;

import java.util.Map;
import java.util.UUID;

import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.model.enums.Role;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Accounts for tests, created through the app's own endpoints. */
public class People {

	private final Api api;

	private final JdbcClient jdbc;

	People(Api api, JdbcClient jdbc) {
		this.api = api;
		this.jdbc = jdbc;
	}

	public record Person(long id, String email, String password, String accessToken, String refreshToken) {
	}

	public static String email() {
		return "person-" + UUID.randomUUID() + "@example.com";
	}

	public static String password() {
		return UUID.randomUUID().toString();
	}

	public Person customer() {
		return create(Role.CUSTOMER);
	}

	public Person manager() {
		return create(Role.MANAGER);
	}

	public Person admin() {
		return create(Role.ADMIN, Role.MANAGER);
	}

	/** Staff whose password must be changed: signed in, without roles. */
	public Person newManager() {
		Person person = create(Role.MANAGER);
		jdbc.sql("update users set must_change_password = true where id = ?").param(person.id()).update();
		return signIn(person.email(), person.password());
	}

	public Person signIn(String email, String password) {
		Answer answer = api.post("/api/auth/login", Map.of("email", email, "password", password), null);
		if (answer.status() != 200) {
			throw new IllegalStateException("login answered " + answer.status() + " " + answer.text());
		}
		long id = jdbc.sql("select id from users where email = ?").param(email).query(Long.class).single();
		return new Person(id, email, password, answer.json().get("accessToken").asString(),
				answer.json().get("refreshToken").asString());
	}

	private Person create(Role... roles) {
		String email = email();
		String password = password();
		Answer answer = api.post("/api/auth/register",
				Map.of("email", email, "password", password, "firstName", "Asha", "lastName", "Rao"), null);
		if (answer.status() != 201) {
			throw new IllegalStateException("register answered " + answer.status() + " " + answer.text());
		}
		long id = answer.json().get("id").asLong();
		jdbc.sql("delete from user_roles where user_id = ?").param(id).update();
		for (Role role : roles) {
			jdbc.sql("insert into user_roles (user_id, role) values (?, ?)").params(id, role.name()).update();
		}
		return signIn(email, password);
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class Configuration {

		@Bean
		People people(Api api, JdbcClient jdbc) {
			return new People(api, jdbc);
		}

	}

}
