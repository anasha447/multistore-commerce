package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.KeyPairGenerator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.ecommerce.store.Api;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;
import com.ecommerce.store.contract.Contract;
import com.ecommerce.store.model.BaseEntity;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Every documented endpoint against every kind of caller. Endpoints not built yet answer 404 to those let in. */
@IntegrationTest
class AccessMatrixTests {

	private static final int LET_IN = 0;

	/** Who gets past the door, by the contract's access word: customer, manager, admin, must-change. */
	private static final Map<String, List<Integer>> EXPECTED = Map.of("public", List.of(0, 0, 0, 0), "customer",
			List.of(0, 0, 0, 0), "self", List.of(0, 0, 0, 0), "owner", List.of(0, 0, 0, 0), "owner or staff",
			List.of(0, 0, 0, 0), "staff", List.of(403, 0, 0, 403), "admin", List.of(403, 403, 0, 403));

	@Autowired
	private Api api;

	@Autowired
	private People people;

	@Autowired
	private JdbcClient jdbc;

	@Test
	void everyEndpointLetsInExactlyWhoTheContractSays() throws Exception {
		Person disabled = people.admin();
		jdbc.sql("update users set enabled = false where id = ?").param(disabled.id()).update();
		String otherStore = otherStore();
		Map<String, String> callers = new LinkedHashMap<>();
		callers.put("customer", people.customer().accessToken());
		callers.put("manager", people.manager().accessToken());
		callers.put("admin", people.admin().accessToken());
		callers.put("must change password", people.newManager().accessToken());

		List<Contract.Endpoint> endpoints = Contract.load().endpoints();
		assertThat(endpoints).hasSize(91);
		List<String> wrong = new ArrayList<>();
		for (Contract.Endpoint endpoint : endpoints) {
			check(wrong, endpoint, "guest", null, endpoint.access().equals("public") ? LET_IN : 401);
			check(wrong, endpoint, "other store", otherStore, 403);
			check(wrong, endpoint, "disabled", disabled.accessToken(), 401);
			int i = 0;
			for (Map.Entry<String, String> caller : callers.entrySet()) {
				check(wrong, endpoint, caller.getKey(), caller.getValue(), EXPECTED.get(endpoint.access()).get(i++));
			}
		}
		assertThat(wrong).isEmpty();
	}

	@ParameterizedTest
	@CsvSource({ "GET,/api/unknown", "GET,/", "GET,/api", "POST,/api/products/1/cost", "GET,/internal/stock",
			"GET,/actuator/health", "GET,/v3/api-docs", "DELETE,/api/orders/1", "GET,/api/auth/login" })
	void whatIsNotDocumentedIsClosed(String method, String path) {
		assertThat(api.send(method, path, null, null).status()).isEqualTo(401);
	}

	@Test
	void aManagerCannotOpenAnUndocumentedPathEither() {
		assertThat(api.get("/api/unknown", people.admin().accessToken()).status()).isEqualTo(403);
	}

	private void check(List<String> wrong, Contract.Endpoint endpoint, String who, String token, int expected) {
		Object body = List.of("POST", "PUT", "PATCH").contains(endpoint.method()) ? Map.of() : null;
		int status = api.send(endpoint.method(), path(endpoint), body, token).status();
		boolean right = (expected == LET_IN) ? status != 401 && status != 403 && status < 500 : status == expected;
		if (!right) {
			wrong.add("%s %s as %s: %d, expected %s".formatted(endpoint.method(), endpoint.path(), who, status,
					(expected == LET_IN) ? "let in" : expected));
		}
	}

	private static String path(Contract.Endpoint endpoint) {
		if (image(endpoint)) {
			return "/media/matessa/" + "a1".repeat(16) + ".webp";
		}
		return endpoint.path()
			.replace("{slug}", "masala-mate")
			.replace("{orderNumber}", "MA261117-7K3QXD")
			.replaceAll("\\{\\w+}", Long.toString(BaseEntity.newId()));
	}

	private static boolean image(Contract.Endpoint endpoint) {
		return endpoint.path().startsWith("/media/");
	}

	private static String otherStore() throws Exception {
		KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		SignedJWT token = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256),
				new JWTClaimsSet.Builder().subject(Long.toString(BaseEntity.newId()))
					.audience("adventure")
					.claim("tenant", "adventure")
					.claim("roles", List.of("ADMIN"))
					.expirationTime(Date.from(Instant.now().plusSeconds(600)))
					.build());
		token.sign(new RSASSASigner(generator.generateKeyPair().getPrivate()));
		return token.serialize();
	}

}
