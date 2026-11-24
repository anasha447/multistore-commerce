package com.ecommerce.store.model;

import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.userdetails.UserDetails;

import com.ecommerce.store.model.enums.Role;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity implements UserDetails {

	private String email;

	private String passwordHash;

	private String firstName;

	private String lastName;

	private String phone;

	@Builder.Default
	private boolean enabled = true;

	private boolean mustChangePassword;

	// changed by guarded updates only, see UserRepository
	@Column(insertable = false, updatable = false)
	private int failedLogins;

	@Column(insertable = false, updatable = false)
	private Instant lockedUntil;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	@Builder.Default
	@ElementCollection
	@CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
	@Column(name = "role")
	@Enumerated(EnumType.STRING)
	private Set<Role> roles = new HashSet<>();

	/** Emails are stored and looked up in this form only. */
	public static String normaliseEmail(String email) {
		return email.strip().toLowerCase(Locale.ROOT);
	}

	@Override
	public Set<Role> getAuthorities() {
		return roles;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

}
