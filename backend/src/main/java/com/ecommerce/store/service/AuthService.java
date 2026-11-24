package com.ecommerce.store.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.PasswordPolicy;

/** Register and sign in. Hashing is slow on purpose and happens outside any transaction. */
@Service
@RequiredArgsConstructor
public class AuthService {

	private static final int ALLOWED_FAILURES = 5;

	private static final Duration LOCK = Duration.ofMinutes(15);

	private final UserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final PasswordPolicy passwordPolicy;

	private final AuthenticationManager authenticationManager;

	private final RefreshTokenService refreshTokens;

	private final Clock clock;

	public UserResponse register(RegisterRequest request) {
		passwordPolicy.requireUncommon(request.password());
		ApiException taken = ApiException.conflict("An account with this email already exists. Sign in instead.");
		String email = User.normaliseEmail(request.email());
		if (users.existsByEmail(email)) {
			throw taken;
		}
		try {
			return UserResponse.from(users.save(User.builder()
				.email(email)
				.passwordHash(passwordEncoder.encode(request.password()))
				.firstName(request.firstName())
				.lastName(request.lastName())
				.phone(request.phone())
				.roles(Set.of(Role.CUSTOMER))
				.build()));
		}
		catch (DataIntegrityViolationException ex) {
			throw users.existsByEmail(email) ? taken : ex;
		}
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
