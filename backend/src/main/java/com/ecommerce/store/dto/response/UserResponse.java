package com.ecommerce.store.dto.response;

import java.util.Set;
import java.util.TreeSet;

import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;

public record UserResponse(Long id, String email, String firstName, String lastName, String phone, Set<Role> roles,
		boolean mustChangePassword) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getPhone(),
				new TreeSet<>(user.getRoles()), user.isMustChangePassword());
	}

}
