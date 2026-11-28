package com.ecommerce.store.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import com.ecommerce.store.dto.request.ChangePasswordRequest;
import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.RateLimitRule;
import com.ecommerce.store.security.RateLimiter;
import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.service.interfaces.AuthService;
import com.ecommerce.store.service.interfaces.RefreshTokenService;
import com.ecommerce.store.service.interfaces.UserService;

/** Limits are counted before any transaction starts, so a flood costs no database connections. */
@Service
@RequiredArgsConstructor
class AuthServiceImpl implements AuthService {

	private final UserService userService;

	private final RefreshTokenService refreshTokens;

	private final AuditService audit;

	private final AuthenticationManager authenticationManager;

	private final RateLimiter rateLimiter;

	private final TransactionTemplate transaction;

	@Override
	public UserResponse register(RegisterRequest request) {
		return UserResponse.from(userService.createCustomer(request));
	}

	@Override
	public TokenResponse login(LoginRequest request) {
		rateLimiter.check(RateLimitRule.LOGIN_ACCOUNT, User.normaliseEmail(request.email()));
		try {
			var attempt = UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password());
			return refreshTokens.open((User) authenticationManager.authenticate(attempt).getPrincipal());
		}
		catch (BadCredentialsException ex) {
			userService.countFailedSignIn(request.email());
			audit.recordFailedSignIn(request.email());
			throw ApiException.badCredentials();
		}
		catch (ApiException ex) {
			// locked, disabled or given a new password meanwhile
			audit.recordFailedSignIn(request.email());
			throw ApiException.badCredentials();
		}
	}

	@Override
	public TokenResponse refresh(String refreshToken) {
		rateLimiter.check(RateLimitRule.REFRESH, refreshToken);
		return refreshTokens.refresh(refreshToken);
	}

	@Override
	public void logout(String refreshToken) {
		refreshTokens.logout(refreshToken);
	}

	/** Hashing happens outside the transaction. */
	@Override
	public void changePassword(Long userId, ChangePasswordRequest request) {
		if (!userService.passwordMatches(userId, request.currentPassword())) {
			throw ApiException.badRequest("Current password is incorrect");
		}
		String hash = userService.hashNewPassword(request.newPassword());
		transaction.executeWithoutResult(status -> {
			userService.setPasswordHash(userId, hash);
			refreshTokens.revokeAll(userId);
		});
	}

}
