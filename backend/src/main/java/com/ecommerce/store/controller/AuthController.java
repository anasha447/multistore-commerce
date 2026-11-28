package com.ecommerce.store.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RefreshRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.model.enums.RateLimitRule;
import com.ecommerce.store.security.RateLimited;
import com.ecommerce.store.service.interfaces.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	@RateLimited({ RateLimitRule.REGISTER, RateLimitRule.REGISTER_DAY })
	@ResponseStatus(HttpStatus.CREATED)
	UserResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@RateLimited(RateLimitRule.LOGIN)
	TokenResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	/** Never limited by address: all refreshes come from the storefront itself. Limited by token instead. */
	@PostMapping("/refresh")
	@RateLimited({})
	TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request.refreshToken());
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void logout(@Valid @RequestBody RefreshRequest request) {
		authService.logout(request.refreshToken());
	}

}
