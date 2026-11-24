package com.ecommerce.store.service.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.model.enums.Role;

/** What an admin does with accounts. */
public interface StaffService {

	/** A manager who must change the password. */
	AdminUserResponse create(CreateStaffRequest request);

	/** Both filters are optional. */
	Page<AdminUserResponse> list(Role role, Boolean enabled, Pageable pageable);

	AdminUserResponse get(Long id);

	/** Disabling ends every sign-in and refuses the access token on its next request. */
	AdminUserResponse changeStatus(Long adminId, Long id, boolean enabled);

}
