package com.ecommerce.store.identity.internal;

import java.time.Duration;
import java.time.Instant;

import com.ecommerce.store.platform.PublicEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One link in the chain (family) of tokens that belongs to one sign-in. */
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class RefreshToken extends PublicEntity {

	static final Duration LIFETIME = Duration.ofDays(7);

	/** Two tabs refreshing together are not a theft. */
	private static final Duration GRACE = Duration.ofSeconds(10);

	@Column(updatable = false)
	private Long userId;

	@Column(updatable = false)
	private String tokenHash;

	@Column(updatable = false)
	private String familyId;

	@Column(updatable = false)
	private Instant expiresAt;

	private boolean revoked;

	private Instant rotatedAt;

	@Column(updatable = false)
	private Instant createdAt;

	RefreshToken(long userId, String tokenHash, String familyId, Instant now) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.familyId = familyId;
		this.createdAt = now;
		this.expiresAt = now.plus(LIFETIME);
	}

	boolean isExpired(Instant now) {
		return !expiresAt.isAfter(now);
	}

	/** Exchanged a moment ago: refused, but no reason to end the session. */
	boolean isJustRotated(Instant now) {
		return rotatedAt != null && !now.isAfter(rotatedAt.plus(GRACE));
	}

	void rotate(Instant now) {
		this.revoked = true;
		this.rotatedAt = now;
	}

}
