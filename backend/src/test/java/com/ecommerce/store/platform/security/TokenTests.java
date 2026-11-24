package com.ecommerce.store.platform.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
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
import com.ecommerce.store.platform.AccessTokens;
import com.ecommerce.store.platform.PublicId;
import com.ecommerce.store.platform.Role;
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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.simple.JdbcClient;

@IntegrationTest
class TokenTests {

	@Autowired
	private Api api;

	@Autowired
	private AccessTokens tokens;

	@Autowired
	private JwtKeys keys;

	@Autowired
	private TestClock clock;

	@Autowired
	private JdbcClient jdbc;

	private long userId;

	@BeforeEach
	void createAccount() {
		userId = PublicId.next();
		jdbc.sql("""
				insert into users (id, email, password_hash, first_name, last_name, enabled, must_change_password,
				created_at, updated_at) values (?, ?, 'x', 'A', 'B', true, false, now(), now())""")
			.params(userId, userId + "@example.com")
			.update();
	}

	@AfterEach
	void resetClock() {
		clock.reset();
	}

	@Test
	void carriesWhatTheStorefrontReads() throws Exception {
		String token = tokens.issue(userId, Set.of(Role.MANAGER, Role.ADMIN), false);
		assertThat(token.split("\\.")[1]).matches("[A-Za-z0-9_-]+");
		SignedJWT jwt = SignedJWT.parse(token);
		assertThat(jwt.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.RS256);
		assertThat(jwt.getHeader().getKeyID()).isEqualTo(keys.signing().getKeyID());
		JWTClaimsSet claims = jwt.getJWTClaimsSet();
		assertThat(claims.getSubject()).isEqualTo(Long.toString(userId));
		assertThat(claims.getStringListClaim("roles")).containsExactly("ADMIN", "MANAGER");
		assertThat(claims.getStringClaim("tenant")).isEqualTo("matessa");
		assertThat(claims.getBooleanClaim("pwd_change")).isFalse();
		assertThat(claims.getIssuer()).isEqualTo("matessa");
		assertThat(claims.getExpirationTime().getTime() - claims.getIssueTime().getTime()).isEqualTo(900_000);
	}

	@Test
	void hasNoRolesWhileThePasswordMustBeChanged() throws Exception {
		JWTClaimsSet claims = SignedJWT.parse(tokens.issue(userId, Set.of(Role.ADMIN), true)).getJWTClaimsSet();
		assertThat(claims.getStringListClaim("roles")).isEmpty();
		assertThat(claims.getBooleanClaim("pwd_change")).isTrue();
	}

	@Test
	void aValidTokenIsAccepted() {
		// nothing is open yet, so a known caller is told so
		assertThat(status(tokens.issue(userId, Set.of(Role.CUSTOMER), false))).isEqualTo(403);
	}

	@Test
	void expiresAfterFifteenMinutesSharp() {
		String token = tokens.issue(userId, Set.of(Role.CUSTOMER), false);
		clock.advance(Duration.ofSeconds(890));
		assertThat(status(token)).isEqualTo(403);
		clock.advance(Duration.ofSeconds(11));
		assertThat(status(token)).isEqualTo(401);
	}

	@Test
	void aMissingOrDisabledAccountIsRefusedAtOnce() {
		String token = tokens.issue(userId, Set.of(Role.CUSTOMER), false);
		jdbc.sql("update users set enabled = false where id = ?").param(userId).update();
		assertThat(status(token)).isEqualTo(401);
		assertThat(status(tokens.issue(PublicId.next(), Set.of(Role.CUSTOMER), false))).isEqualTo(401);
	}

	@Test
	void forgeriesAreRefused() throws Exception {
		String good = tokens.issue(userId, Set.of(Role.CUSTOMER), false);
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
		JWSSigner withPublicKey = new MACSigner(keys.signing().toRSAPublicKey().getEncoded());
		assertThat(status(sign(JWSAlgorithm.HS256, withPublicKey, claims(c -> {
		})))).as("HS256 with the public key").isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, new RSASSASigner(pair().getPrivate()), claims(c -> {
		})))).as("another key").isEqualTo(401);
		assertThat(status("not-a-token")).isEqualTo(401);
		assertThat(status("")).isEqualTo(401);
	}

	@Test
	void wellSignedButWrongClaimsAreRefused() throws Exception {
		JWSSigner ours = new RSASSASigner(keys.signing());
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> {
		})))).as("control").isEqualTo(403);
		assertThat(status(sign(JWSAlgorithm.RS512, ours, claims(c -> {
		})))).as("RS512").isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.issuer("other"))))).isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.expirationTime(null))))).isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.claim("tenant", null))))).isEqualTo(401);
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.subject("1"))))).isEqualTo(401);
	}

	@Test
	void anotherStoresTokenIsForbidden() throws Exception {
		JWSSigner theirs = new RSASSASigner(pair().getPrivate());
		Consumer<JWTClaimsSet.Builder> adventure = c -> c.claim("tenant", "adventure").issuer("adventure");
		assertThat(status(sign(JWSAlgorithm.RS256, theirs, claims(adventure)))).isEqualTo(403);
		JWSSigner ours = new RSASSASigner(keys.signing());
		assertThat(status(sign(JWSAlgorithm.RS256, ours, claims(c -> c.claim("tenant", "adventure"))))).isEqualTo(403);
	}

	@Test
	void keysRotateWithoutSigningAnyoneOut() throws Exception {
		KeyPair old = pair();
		KeyPair current = pair();
		JwtKeys both = JwtKeys.load(pem("PRIVATE KEY", current.getPrivate().getEncoded()),
				pem("PUBLIC KEY", current.getPublic().getEncoded(), old.getPublic().getEncoded()));
		assertThat(both.verifying().getKeys()).hasSize(2);
		assertThat(both.verifying().getKeyByKeyId(both.signing().getKeyID()).isPrivate()).isFalse();
	}

	@Test
	void keysThatCannotWorkStopTheApp() throws Exception {
		KeyPair one = pair();
		assertThatIllegalStateException()
			.isThrownBy(() -> JwtKeys.load(pem("PRIVATE KEY", one.getPrivate().getEncoded()),
					pem("PUBLIC KEY", pair().getPublic().getEncoded())))
			.withMessageContaining("public half");
		KeyPairGenerator small = KeyPairGenerator.getInstance("RSA");
		small.initialize(1024);
		KeyPair weak = small.generateKeyPair();
		assertThatIllegalStateException()
			.isThrownBy(() -> JwtKeys.load(pem("PRIVATE KEY", weak.getPrivate().getEncoded()),
					pem("PUBLIC KEY", weak.getPublic().getEncoded())))
			.withMessageContaining("2048");
	}

	private int status(String token) {
		return api.get("/api/not-in-the-contract", token).status();
	}

	private JWTClaimsSet claims(Consumer<JWTClaimsSet.Builder> change) {
		Instant now = clock.instant();
		JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder().issuer("matessa")
			.subject(Long.toString(userId))
			.claim("tenant", "matessa")
			.claim("roles", List.of("CUSTOMER"))
			.issueTime(Date.from(now))
			.expirationTime(Date.from(now.plusSeconds(600)));
		change.accept(builder);
		return builder.build();
	}

	private String sign(JWSAlgorithm algorithm, JWSSigner signer, JWTClaimsSet claims) throws Exception {
		SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(algorithm).keyID(keys.signing().getKeyID()).build(), claims);
		jwt.sign(signer);
		return jwt.serialize();
	}

	private static KeyPair pair() throws Exception {
		KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		return generator.generateKeyPair();
	}

	private static Resource pem(String kind, byte[]... keys) {
		StringBuilder text = new StringBuilder();
		for (byte[] key : keys) {
			text.append("-----BEGIN ").append(kind).append("-----\n");
			text.append(Base64.getMimeEncoder().encodeToString(key));
			text.append("\n-----END ").append(kind).append("-----\n");
		}
		return new ByteArrayResource(text.toString().getBytes(StandardCharsets.US_ASCII));
	}

}
