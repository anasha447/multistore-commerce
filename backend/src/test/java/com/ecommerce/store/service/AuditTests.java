package com.ecommerce.store.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.Api;
import com.ecommerce.store.Api.Answer;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.contract.Contract;

@IntegrationTest
class AuditTests {

	/** Staff writes proven below. A new one fails the first test until it is added here with its own test. */
	private static final Set<String> COVERED = Set.of("POST /api/admin/users", "PUT /api/admin/users/{}/status");

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private JdbcClient jdbc;

	@Autowired
	private AuditService audit;

	@Autowired
	@Qualifier("requestMappingHandlerMapping")
	private RequestMappingHandlerMapping mappings;

	@Test
	void everyStaffWriteIsCoveredHere() {
		Map<String, String> access = new HashMap<>();
		Contract.load().endpoints().forEach(e -> access.put(e.method() + " " + e.shape(), e.access()));
		Set<String> served = new TreeSet<>();
		mappings.getHandlerMethods().keySet().forEach(info -> info.getPatternValues().forEach(path -> info.getMethodsCondition()
			.getMethods().forEach(method -> served.add(method + " " + Contract.shapeOf(path)))));
		served.removeIf(endpoint -> endpoint.startsWith("GET ") || !Set.of("staff", "admin").contains(access.getOrDefault(endpoint, "")));
		assertThat(served).isEqualTo(new TreeSet<>(COVERED));
	}

	@Test
	void creatingStaffIsRecorded() {
		Person admin = people.admin();
		String password = People.password();
		Answer answer = api.post("/api/admin/users", Map.of("email", People.email(), "password", password, "firstName", "Dev",
				"lastName", "Nair"), admin.accessToken());
		Map<String, Object> entry = only("STAFF_CREATED", answer.json().get("id").asLong());
		assertThat(entry).containsEntry("actor_id", admin.id()).containsEntry("entity", "user").containsEntry("before", null);
		assertThat(entry.get("actor_roles").toString()).contains("ADMIN");
		assertThat(entry.get("client_ip").toString()).startsWith("10.");
		assertThat(entry.get("request_id")).isEqualTo(answer.headers().firstValue("X-Request-Id").orElseThrow());
		assertThat(entry.get("after").toString()).contains("\"lastName\"").doesNotContain(password).doesNotContainIgnoringCase("hash");
	}

	@Test
	void changingAStatusIsRecordedWithBeforeAndAfter() {
		Person admin = people.admin();
		Person customer = people.customer();
		status(admin, customer.id(), false);
		Map<String, Object> disabled = only("ACCOUNT_DISABLED", customer.id());
		assertThat(disabled.get("before").toString()).contains("\"enabled\": true");
		assertThat(disabled.get("after").toString()).contains("\"enabled\": false");
		status(admin, customer.id(), true);
		only("ACCOUNT_ENABLED", customer.id());
	}

	@Test
	void whatIsRefusedLeavesNoEntry() {
		Person admin = people.admin();
		status(admin, admin.id(), false);
		Person customer = people.customer();
		status(people.manager(), customer.id(), false);
		api.post("/api/admin/users", Map.of("email", customer.email(), "password", People.password(), "firstName", "A",
				"lastName", "B"), admin.accessToken());
		assertThat(entries("ACCOUNT_DISABLED", admin.id())).isEmpty();
		assertThat(entries("ACCOUNT_DISABLED", customer.id())).isEmpty();
		assertThat(jdbc.sql("select count(*) from audit_entries where action = 'STAFF_CREATED' and actor_id = ?")
			.param(admin.id()).query(Integer.class).single()).isZero();
	}

	@Test
	void staffSignInsAreRecordedAndCustomersAreNot() {
		Person manager = people.manager();
		assertThat(entries("SIGN_IN", manager.id())).hasSize(1);
		login(manager.email(), People.password());
		assertThat(entries("SIGN_IN_FAILED", manager.id())).hasSize(1);
		jdbc.sql("update users set enabled = false where id = ?").param(manager.id()).update();
		login(manager.email(), manager.password());
		assertThat(entries("SIGN_IN_FAILED", manager.id())).as("right password, disabled account").hasSize(2);

		Person customer = people.customer();
		login(customer.email(), People.password());
		assertThat(entries("SIGN_IN", customer.id())).isEmpty();
		assertThat(entries("SIGN_IN_FAILED", customer.id())).isEmpty();
	}

	@Test
	void anEntryNeedsTheTransactionOfItsChange() {
		assertThatExceptionOfType(IllegalTransactionStateException.class)
			.isThrownBy(() -> audit.record("X", "user", 1L, null, null));
	}

	private void status(Person by, long id, boolean enabled) {
		api.put("/api/admin/users/" + id + "/status", Map.of("enabled", enabled), by.accessToken());
	}

	private void login(String email, String password) {
		api.post("/api/auth/login", Map.of("email", email, "password", password), null);
	}

	private Map<String, Object> only(String action, long entityId) {
		List<Map<String, Object>> found = entries(action, entityId);
		assertThat(found).hasSize(1);
		return found.getFirst();
	}

	private List<Map<String, Object>> entries(String action, long entityId) {
		return jdbc.sql("select * from audit_entries where action = ? and entity_id = ?")
			.params(action, Long.toString(entityId))
			.query()
			.listOfRows();
	}

}
