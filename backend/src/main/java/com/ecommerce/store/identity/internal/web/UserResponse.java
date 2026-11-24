package com.ecommerce.store.identity.internal.web;

import java.util.Set;
import java.util.TreeSet;

import com.ecommerce.store.identity.internal.User;
import com.ecommerce.store.platform.Role;

record UserResponse(Long id, String email, String firstName, String lastName, String phone, Set<Role> roles,
		boolean mustChangePassword) {

	static UserResponse of(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getPhone(),
				new TreeSet<>(user.getRoles()), user.isMustChangePassword());
	}

}
