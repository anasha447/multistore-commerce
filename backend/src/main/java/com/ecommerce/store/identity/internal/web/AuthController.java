package com.ecommerce.store.identity.internal.web;

import com.ecommerce.store.identity.internal.Accounts;
import com.ecommerce.store.identity.internal.Sessions;
import com.ecommerce.store.platform.AccessTokens;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
class AuthController {

	record RegisterRequest(@NotBlank @Email String email, @NotBlank @Size(min = 8, max = 100) String password,
			@NotBlank String firstName, @NotBlank String lastName, String phone) {
	}

	record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
	}

	record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {

		static TokenResponse of(Sessions.Pair pair) {
			return new TokenResponse(pair.accessToken(), pair.refreshToken(), "Bearer", AccessTokens.LIFETIME.toSeconds());
		}

	}

	private final Accounts accounts;

	AuthController(Accounts accounts) {
		this.accounts = accounts;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	UserResponse register(@Valid @RequestBody RegisterRequest request) {
		return UserResponse.of(accounts.register(request.email(), request.password(), request.firstName(),
				request.lastName(), request.phone()));
	}

	@PostMapping("/login")
	TokenResponse login(@Valid @RequestBody LoginRequest request) {
		return TokenResponse.of(accounts.signIn(request.email(), request.password()));
	}

}
