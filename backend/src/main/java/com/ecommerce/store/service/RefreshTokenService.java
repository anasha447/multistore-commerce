package com.ecommerce.store.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.RefreshToken;
import com.ecommerce.store.model.User;
import com.ecommerce.store.repository.RefreshTokenRepository;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.JwtService;

/**
 * Sign-ins and their refresh tokens. Every change locks the account's row first, so a token being
 * exchanged cannot slip past a revocation that happens at the same moment.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

	private static final Duration LIFETIME = Duration.ofDays(7);

	/** Two tabs refreshing together are not a theft. */
	private static final Duration GRACE = Duration.ofSeconds(10);

	private static final StringKeyGenerator RANDOM = new Base64StringKeyGenerator(
			Base64.getUrlEncoder().withoutPadding(), 32);

	private final RefreshTokenRepository tokens;

	private final UserRepository users;

	private final JwtService jwt;

	private final Clock clock;

	/** A new sign-in, unless the account was locked, disabled or given a new password meanwhile. */
	@Transactional
	public TokenResponse open(User user) {
		if (users.clearFailures(user.getId(), user.getPasswordHash(), clock.instant()) == 0) {
			throw AuthService.refused();
		}
		return issue(user, UUID.randomUUID().toString());
	}

	/** What a refusal revokes stays revoked. */
	@Transactional(noRollbackFor = ApiException.class)
	public TokenResponse refresh(String value) {
		ApiException over = ApiException.unauthorized("Refresh token expired or revoked");
		Long owner = tokens.findOwner(hash(value))
			.orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
		User user = users.findAndLock(owner).orElseThrow(() -> over);
		RefreshToken token = tokens.findByTokenHash(hash(value)).orElseThrow(() -> over);
		Instant now = clock.instant();
		if (token.isRevoked()) {
			boolean justRotated = token.getRotatedAt() != null && !now.isAfter(token.getRotatedAt().plus(GRACE));
			if (!justRotated) {
				tokens.revokeFamily(token.getFamilyId());
			}
			throw over;
		}
		if (!token.getExpiresAt().isAfter(now) || !user.isEnabled()) {
			throw over;
		}
		token.setRevoked(true);
		token.setRotatedAt(now);
		return issue(user, token.getFamilyId());
	}

	/** Ends the sign-in the token belongs to. Unknown tokens are fine. */
	@Transactional
	public void logout(String value) {
		tokens.findOwner(hash(value)).flatMap(users::findAndLock).flatMap(user -> tokens.findByTokenHash(hash(value)))
			.ifPresent(token -> tokens.revokeFamily(token.getFamilyId()));
	}

	private TokenResponse issue(User user, String family) {
		String value = RANDOM.generateKey();
		tokens.save(RefreshToken.builder()
			.userId(user.getId())
			.tokenHash(hash(value))
			.familyId(family)
			.expiresAt(clock.instant().plus(LIFETIME))
			.build());
		return new TokenResponse(jwt.issue(user), value, "Bearer", JwtService.LIFETIME.toSeconds());
	}

	@SneakyThrows
	private static String hash(String value) {
		byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
		return HexFormat.of().formatHex(digest);
	}

}
