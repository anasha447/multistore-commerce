package com.ecommerce.store.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.store.dto.request.ChangePasswordRequest;
import com.ecommerce.store.dto.request.UpdateProfileRequest;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.model.enums.RateLimitRule;
import com.ecommerce.store.security.CurrentUserId;
import com.ecommerce.store.security.RateLimited;
import com.ecommerce.store.service.interfaces.UserService;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
class UserController {

	private final UserService userService;

	@GetMapping
	UserResponse me(@CurrentUserId Long userId) {
		return userService.me(userId);
	}

	@PutMapping
	UserResponse update(@CurrentUserId Long userId, @Valid @RequestBody UpdateProfileRequest request) {
		return userService.update(userId, request);
	}

	@PutMapping("/password")
	@RateLimited(RateLimitRule.PASSWORD)
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void changePassword(@CurrentUserId Long userId, @Valid @RequestBody ChangePasswordRequest request) {
		userService.changePassword(userId, request);
	}

}
