package com.ecommerce.store.identity.internal;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

import com.ecommerce.store.platform.PublicEntity;
import com.ecommerce.store.platform.Role;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends PublicEntity {

	private String email;

	private String passwordHash;

	private String firstName;

	private String lastName;

	private String phone;

	private boolean enabled;

	private boolean mustChangePassword;

	// written by guarded updates only, see UserRepository
	@Column(insertable = false, updatable = false)
	private int failedLogins;

	@Column(insertable = false, updatable = false)
	private Instant lockedUntil;

	@Column(updatable = false)
	private Instant createdAt;

	private Instant updatedAt;

	@ElementCollection
	@CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
	@Column(name = "role")
	@Enumerated(EnumType.STRING)
	private Set<Role> roles = EnumSet.noneOf(Role.class);

	User(String email, String passwordHash, String firstName, String lastName, String phone, Collection<Role> roles,
			boolean mustChangePassword, Instant now) {
		this.email = normalise(email);
		this.passwordHash = passwordHash;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.roles.addAll(roles);
		this.enabled = true;
		this.mustChangePassword = mustChangePassword;
		this.createdAt = now.truncatedTo(ChronoUnit.MICROS);
		this.updatedAt = this.createdAt;
	}

	/** Emails are written and looked up in this form only. */
	static String normalise(String email) {
		return email.strip().toLowerCase(Locale.ROOT);
	}

	boolean isLocked(Instant now) {
		return lockedUntil != null && lockedUntil.isAfter(now);
	}

	void changeProfile(String firstName, String lastName, String phone, Instant now) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.updatedAt = now;
	}

	void changePassword(String passwordHash, Instant now) {
		this.passwordHash = passwordHash;
		this.mustChangePassword = false;
		this.updatedAt = now;
	}

	void changeEnabled(boolean enabled, Instant now) {
		this.enabled = enabled;
		this.updatedAt = now;
	}

}
