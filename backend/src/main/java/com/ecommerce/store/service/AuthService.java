package com.ecommerce.store.service;

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

/** Register and sign in. */
@Service
@RequiredArgsConstructor
public class AuthService {

	private static final int ALLOWED_FAILURES = 5;

	private static final Duration LOCK = Duration.ofMinutes(15);

	private final UserRepository users;

	private final UserService userService;

	private final AuthenticationManager authenticationManager;

	private final RefreshTokenService refreshTokens;

	private final Clock clock;

	public UserResponse register(RegisterRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.CUSTOMER))
			.build();
		return UserResponse.from(userService.create(user, request.password(),
				"An account with this email already exists. Sign in instead."));
	}

	/** Every way to fail looks the same and takes as long. */
	public TokenResponse login(LoginRequest request) {
		try {
			var attempt = UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password());
			return refreshTokens.open((User) authenticationManager.authenticate(attempt).getPrincipal());
		}
		catch (BadCredentialsException ex) {
			Instant now = clock.instant();
			users.countFailure(User.normaliseEmail(request.email()), ALLOWED_FAILURES, now.plus(LOCK), now);
			throw refused();
		}
		catch (AccountStatusException ex) {
			throw refused();
		}
	}

	static ApiException refused() {
		return ApiException.unauthorized("Invalid email or password.");
	}

}
