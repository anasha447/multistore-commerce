package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import com.ecommerce.store.Api;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.TestClock;
import com.ecommerce.store.model.BaseEntity;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;

@IntegrationTest
class TokenTests {

	@Autowired
	private Api api;

	@Autowired
	private JwtService jwt;

	@Autowired
	private UserRepository users;

	@Value("${JWT_PRIVATE_KEY}")
	private RSAPrivateKey privateKey;

	@Value("${JWT_PUBLIC_KEY}")
	private RSAPublicKey publicKey;

	@Autowired
	private TestClock clock;

	@Autowired
	private JdbcClient jdbc;

	private User user;

	@BeforeEach
	void createAccount() {
		user = users.save(User.builder()
			.email(BaseEntity.newId() + "@example.com")
			.passwordHash("x")
			.firstName("A")
			.lastName("B")
			.roles(Set.of(Role.CUSTOMER))
			.build());
	}

	@AfterEach
	void resetClock() {
		clock.reset();
	}

	@Test
	void carriesWhatTheStorefrontReads() throws Exception {
		user.setRoles(Set.of(Role.MANAGER, Role.ADMIN));
		String token = jwt.issue(user);
		assertThat(token.split("\\.")[1]).matches("[A-Za-z0-9_-]+");
		SignedJWT parsed = SignedJWT.parse(token);
		assertThat(parsed.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.RS256);
		JWTClaimsSet claims = parsed.getJWTClaimsSet();
		assertThat(claims.getSubject()).isEqualTo(user.getId().toString());
		assertThat(claims.getStringListClaim("roles")).containsExactly("ADMIN", "MANAGER");
		assertThat(claims.getStringClaim("tenant")).isEqualTo("matessa");
		assertThat(claims.getBooleanClaim("pwd_change")).isFalse();
		assertThat(claims.getIssuer()).isEqualTo("matessa");
		assertThat(claims.getExpirationTime().getTime() - claims.getIssueTime().getTime()).isEqualTo(900_000);
	}

	@Test
	void hasNoRolesWhileThePasswordMustBeChanged() throws Exception {
		user.setMustChangePassword(true);
		JWTClaimsSet claims = SignedJWT.parse(jwt.issue(user)).getJWTClaimsSet();
		assertThat(claims.getStringListClaim("roles")).isEmpty();
		assertThat(claims.getBooleanClaim("pwd_change")).isTrue();
	}

	@Test
	void aValidTokenIsAccepted() {
		// nothing is open yet, so a known caller is told so
		assertThat(status(jwt.issue(user))).isEqualTo(403);
	}

	@Test
	void isRefusedOnceExpired() {
		// Spring allows a minute for clocks that disagree
		clock.advance(Duration.ofMinutes(-15));
		assertThat(status(jwt.issue(user))).isEqualTo(403);
		clock.advance(Duration.ofSeconds(-61));
		assertThat(status(jwt.issue(user))).isEqualTo(401);
	}

	@Test
	void disabledStaffAreRefusedAtOnce() {
		user.setRoles(Set.of(Role.MANAGER));
		String token = jwt.issue(user);
		jdbc.sql("update users set enabled = false where id = ?").param(user.getId()).update();
		assertThat(status(token)).isEqualTo(401);
	}

	@Test
	void forgeriesAreRefused() throws Exception {
		String good = jwt.issue(user);
		String[] parts = good.split("\\.");
		String admin = Base64.getUrlEncoder()
			.withoutPadding()
			.encodeToString(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8)
				.replace("CUSTOMER", "ADMIN")
				.getBytes(StandardCharsets.UTF_8));
		assertThat(status(parts[0] + "." + admin + "." + parts[2])).as("changed payload").isEqualTo(401);
		assertThat(status(parts[0] + "." + parts[1] + ".")).as("no signature").isEqualTo(401);
		assertThat(status(new PlainJWT(claims(c -> {
		})).serialize())).as("alg none").isEqualTo(401);
		JWSSigner withPublicKey = new MACSigner(publicKey.getEncoded());
		assertThat(status(sign(JWSAlgorithm.HS256, withPublicKey, claims(c -> {
		})))).as("HS256 with the public key").isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, new RSASSASigner(pair().getPrivate()), claims(c -> {
		})))).as("another key").isEqualTo(401);
		assertThat(status("not-a-token")).isEqualTo(401);
		assertThat(status("")).isEqualTo(401);
	}

	@Test
	void wellSignedButWrongClaimsAreRefused() throws Exception {
		JWSSigner ours = new RSASSASigner(privateKey);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> {
		})))).as("control").isEqualTo(403);
		assertThat(status(sign(JWSAlgorithm.RS512, ours, claims(c -> {
		})))).as("RS512").isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.audience("adventure"))))).isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.audience((String) null))))).isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.subject("1"))))).isEqualTo(401);
	}

	@Test
	void anotherStoresTokenIsForbidden() throws Exception {
		JWSSigner theirs = new RSASSASigner(pair().getPrivate());
		Consumer<JWTClaimsSet.Builder> adventure = c -> c.claim("tenant", "adventure").audience("adventure");
		assertThat(status(sign(JWSAlgorithm.RS256, theirs, claims(adventure)))).isEqualTo(403);
	}

	private int status(String token) {
		return api.get("/api/not-in-the-contract", token).status();
	}

	private JWTClaimsSet claims(Consumer<JWTClaimsSet.Builder> change) {
		Instant now = clock.instant();
		JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder().issuer("matessa")
			.audience("matessa")
			.subject(user.getId().toString())
			.claim("tenant", "matessa")
			.claim("roles", List.of("CUSTOMER"))
			.issueTime(Date.from(now))
			.expirationTime(Date.from(now.plusSeconds(600)));
		change.accept(builder);
		return builder.build();
	}

	private String sign(JWSAlgorithm algorithm, JWSSigner signer, JWTClaimsSet claims) throws Exception {
		SignedJWT signed = new SignedJWT(new JWSHeader(algorithm), claims);
		signed.sign(signer);
		return signed.serialize();
	}

	private static KeyPair pair() throws Exception {
		KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		return generator.generateKeyPair();
	}

}
