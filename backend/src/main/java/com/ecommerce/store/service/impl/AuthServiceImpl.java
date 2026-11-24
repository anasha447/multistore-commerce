package com.ecommerce.store.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.service.interfaces.AuthService;
import com.ecommerce.store.service.interfaces.RefreshTokenService;
import com.ecommerce.store.service.interfaces.UserService;

@Service
@RequiredArgsConstructor
class AuthServiceImpl implements AuthService {

	private static final int ALLOWED_FAILURES = 5;

	private static final Duration LOCK = Duration.ofMinutes(15);

	private final UserRepository users;

	private final UserService userService;

	private final AuthenticationManager authenticationManager;

	private final RefreshTokenService refreshTokens;

	private final AuditService audit;

	private final Clock clock;

	@Override
	public UserResponse register(RegisterRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.CUSTOMER))
			.build();
		return UserResponse.from(userService.create(user, request.password(),
				"An account with this email already exists. Sign in instead.", created -> {
				}));
	}

	@Override
	public TokenResponse login(LoginRequest request) {
		try {
			var attempt = UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password());
			return refreshTokens.open((User) authenticationManager.authenticate(attempt).getPrincipal());
		}
		catch (BadCredentialsException ex) {
			Instant now = clock.instant();
			users.countFailure(User.normaliseEmail(request.email()), ALLOWED_FAILURES, now.plus(LOCK), now);
			audit.recordFailedSignIn(request.email());
			throw ApiException.badCredentials();
		}
		catch (AccountStatusException | ApiException ex) {
			audit.recordFailedSignIn(request.email());
			throw ApiException.badCredentials();
		}
	}

}
