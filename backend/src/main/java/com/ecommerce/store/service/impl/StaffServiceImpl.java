package com.ecommerce.store.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommerce.store.config.AfterCommit;
import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.DeniedAccounts;
import com.ecommerce.store.service.Paging;
import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.service.interfaces.RefreshTokenService;
import com.ecommerce.store.service.interfaces.StaffService;
import com.ecommerce.store.service.interfaces.UserService;

/** Reads accounts directly; changes them through UserService. */
@Service
@RequiredArgsConstructor
class StaffServiceImpl implements StaffService {

	private final UserRepository users;

	private final UserService userService;

	private final RefreshTokenService refreshTokens;

	private final AuditService audit;

	private final DeniedAccounts deniedAccounts;

	@Override
	public AdminUserResponse create(CreateStaffRequest request) {
		return AdminUserResponse.from(userService.createStaff(request));
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
		return AdminUserResponse.from(users.findById(id).orElseThrow(() -> ApiException.notFound("Account not found.")));
	}

	/** The access token is refused by ActiveAccountValidator. */
	@Override
	@Transactional
	public AdminUserResponse changeStatus(Long adminId, Long id, boolean enabled) {
		if (adminId.equals(id)) {
			throw ApiException.conflict("You cannot change the status of your own account");
		}
		User user = userService.lock(id);
		AdminUserResponse before = AdminUserResponse.from(user);
		userService.setEnabled(user, enabled);
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

}
