package com.ecommerce.store.service;

import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.RefreshTokenRepository;
import com.ecommerce.store.repository.UserRepository;

/** What an admin does with accounts. */
@Service
@RequiredArgsConstructor
public class StaffService {

	private final UserRepository users;

	private final RefreshTokenRepository refreshTokens;

	private final UserService userService;

	public AdminUserResponse create(CreateStaffRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.MANAGER))
			.mustChangePassword(true)
			.build();
		return AdminUserResponse
			.from(userService.create(user, request.password(), "An account with this email already exists."));
	}

	@Transactional(readOnly = true)
	public Page<AdminUserResponse> list(Role role, Boolean enabled, Pageable pageable) {
		return users.search(role, enabled, Paging.sorted(pageable, Sort.by("createdAt"), "createdAt", "email", "firstName", "lastName"))
			.map(AdminUserResponse::from);
	}

	@Transactional(readOnly = true)
	public AdminUserResponse get(Long id) {
		return AdminUserResponse.from(users.findById(id).orElseThrow(StaffService::notFound));
	}

	/** Disabling ends every sign-in; the access token is refused on its next request, see ActiveAccountValidator. */
	@Transactional
	public AdminUserResponse changeStatus(Long adminId, Long id, boolean enabled) {
		if (adminId.equals(id)) {
			throw ApiException.conflict("You cannot change the status of your own account");
		}
		User user = users.findAndLock(id).orElseThrow(StaffService::notFound);
		user.setEnabled(enabled);
		if (!enabled) {
			refreshTokens.revokeAll(id);
		}
		return AdminUserResponse.from(user);
	}

	private static ApiException notFound() {
		return ApiException.notFound("Account not found.");
	}

}
