package com.ecommerce.store.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/** One link in the chain (family) of tokens that belongs to one sign-in. */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken extends BaseEntity {

	private Long userId;

	private String tokenHash;

	private String familyId;

	private Instant expiresAt;

	private boolean revoked;

	private Instant rotatedAt;

	@CreationTimestamp
	private Instant createdAt;

}
