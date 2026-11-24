package com.ecommerce.store.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.request.UpdateUserStatusRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.security.CurrentUserId;
import com.ecommerce.store.service.StaffService;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
class AdminUserController {

	private final StaffService staffService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	AdminUserResponse create(@Valid @RequestBody CreateStaffRequest request) {
		return staffService.create(request);
	}

	@GetMapping
	Page<AdminUserResponse> list(@RequestParam(required = false) Role role,
			@RequestParam(required = false) Boolean enabled, Pageable pageable) {
		return staffService.list(role, enabled, pageable);
	}

	@GetMapping("/{id}")
	AdminUserResponse get(@PathVariable Long id) {
		return staffService.get(id);
	}

	@PutMapping("/{id}/status")
	AdminUserResponse changeStatus(@CurrentUserId Long adminId, @PathVariable Long id,
			@Valid @RequestBody UpdateUserStatusRequest request) {
		return staffService.changeStatus(adminId, id, request.enabled());
	}

}
