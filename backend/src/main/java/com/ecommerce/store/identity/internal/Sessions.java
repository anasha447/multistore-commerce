package com.ecommerce.store.identity.internal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import com.ecommerce.store.platform.AccessTokens;
import com.ecommerce.store.platform.ApiError;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Sign-ins and their refresh tokens. Every change locks the account's row first, so a token being
 * exchanged cannot slip past a revocation that happens at the same moment.
 */
@Component
public class Sessions {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final RefreshTokenRepository tokens;

	private final UserRepository users;

	private final AccessTokens accessTokens;

	private final TransactionTemplate transaction;

	private final Clock clock;

	Sessions(RefreshTokenRepository tokens, UserRepository users, AccessTokens accessTokens,
			TransactionTemplate transaction, Clock clock) {
		this.tokens = tokens;
		this.users = users;
		this.accessTokens = accessTokens;
		this.transaction = transaction;
		this.clock = clock;
	}

	public record Pair(String accessToken, String refreshToken) {
	}

	/** A new sign-in. The caller holds the account's row lock. */
	@Transactional(propagation = Propagation.MANDATORY)
	public Pair open(User user) {
		return issue(user, UUID.randomUUID().toString(), clock.instant());
	}

	/** Refusals must be raised after the transaction: what they revoke has to stay revoked. */
	public Pair refresh(String token) {
		return transaction.execute(status -> exchange(hash(token)))
			.orElseThrow(() -> ApiError.unauthorized("Refresh token expired or revoked"));
	}

	private Optional<Pair> exchange(String hash) {
		long userId = tokens.ownerOf(hash).orElseThrow(() -> ApiError.unauthorized("Invalid refresh token"));
		users.lock(userId);
		Instant now = clock.instant();
		RefreshToken token = tokens.findByTokenHash(hash).orElseThrow();
		if (token.isRevoked()) {
			if (!token.isJustRotated(now)) {
				tokens.revokeFamily(token.getFamilyId());
			}
			return Optional.empty();
		}
		User user = users.findWithRoles(userId).orElseThrow();
		if (token.isExpired(now) || !user.isEnabled()) {
			return Optional.empty();
		}
		token.rotate(now);
		return Optional.of(issue(user, token.getFamilyId(), now));
	}

	/** Ends the sign-in the token belongs to. Unknown tokens are fine. */
	@Transactional
	public void close(String token) {
		String hash = hash(token);
		tokens.ownerOf(hash).ifPresent(userId -> {
			users.lock(userId);
			tokens.findByTokenHash(hash).ifPresent(found -> tokens.revokeFamily(found.getFamilyId()));
		});
	}

	/** Ends every sign-in of the account. */
	@Transactional(propagation = Propagation.MANDATORY)
	public void closeAll(long userId) {
		users.lock(userId);
		tokens.revokeAll(userId);
	}

	private Pair issue(User user, String family, Instant now) {
		byte[] random = new byte[32];
		RANDOM.nextBytes(random);
		String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
		tokens.save(new RefreshToken(user.getId(), hash(refresh), family, now));
		return new Pair(accessTokens.issue(user.getId(), user.getRoles(), user.isMustChangePassword()), refresh);
	}

	private static String hash(String token) {
		try {
			return HexFormat.of()
				.formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}

}
