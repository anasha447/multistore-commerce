package com.ecommerce.store.dto.response;

import java.time.Instant;
import java.util.Set;
import java.util.TreeSet;

import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;

public record AdminUserResponse(Long id, String email, String firstName, String lastName, String phone, Set<Role> roles,
		boolean enabled, boolean mustChangePassword, Instant createdAt) {

	public static AdminUserResponse from(User user) {
		return new AdminUserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
				user.getPhone(), new TreeSet<>(user.getRoles()), user.isEnabled(), user.isMustChangePassword(),
				user.getCreatedAt());
	}

}
