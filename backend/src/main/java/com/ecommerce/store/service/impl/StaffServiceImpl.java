package com.ecommerce.store.service.impl;

import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.store.config.AfterCommit;
import com.ecommerce.store.config.CacheNames;
import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.RefreshTokenRepository;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.DeniedAccounts;
import com.ecommerce.store.service.Paging;
import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.service.interfaces.StaffService;
import com.ecommerce.store.service.interfaces.UserService;

@Service
@RequiredArgsConstructor
class StaffServiceImpl implements StaffService {

	private final UserRepository users;

	private final RefreshTokenRepository refreshTokens;

	private final UserService userService;

	private final AuditService audit;

	private final DeniedAccounts deniedAccounts;

	@Override
	public AdminUserResponse create(CreateStaffRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.MANAGER))
			.mustChangePassword(true)
			.build();
		return AdminUserResponse.from(userService.create(user, request.password(),
				"An account with this email already exists.", created -> audit.record("STAFF_CREATED", "user",
						created.getId(), null, AdminUserResponse.from(created))));
	}

	@Override
	@Transactional(readOnly = true)
	public Page<AdminUserResponse> list(Role role, Boolean enabled, Pageable pageable) {
		return users.search(role, enabled, Paging.sorted(pageable, Sort.by("createdAt"), "createdAt", "email", "firstName", "lastName"))
			.map(AdminUserResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public AdminUserResponse get(Long id) {
		return AdminUserResponse.from(users.findById(id).orElseThrow(StaffServiceImpl::notFound));
	}

	/** The access token is refused by ActiveAccountValidator. */
	@Override
	@Transactional
	@CacheEvict(cacheNames = CacheNames.ME, key = "#id")
	public AdminUserResponse changeStatus(Long adminId, Long id, boolean enabled) {
		if (adminId.equals(id)) {
			throw ApiException.conflict("You cannot change the status of your own account");
		}
		User user = users.findAndLock(id).orElseThrow(StaffServiceImpl::notFound);
		AdminUserResponse before = AdminUserResponse.from(user);
		user.setEnabled(enabled);
		if (enabled) {
			AfterCommit.run(() -> deniedAccounts.allow(id));
		}
		else {
			refreshTokens.revokeAll(id);
			AfterCommit.run(() -> deniedAccounts.deny(id));
		}
		AdminUserResponse after = AdminUserResponse.from(user);
		audit.record(enabled ? "ACCOUNT_ENABLED" : "ACCOUNT_DISABLED", "user", id, before, after);
		return after;
	}

	private static ApiException notFound() {
		return ApiException.notFound("Account not found.");
	}

}
