package com.ecommerce.store.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.ecommerce.store.repository.UserRepository;

/** Asked for every token: a disabled account is refused on its next request. */
@Component
@RequiredArgsConstructor
class ActiveAccountValidator implements OAuth2TokenValidator<Jwt> {

	private final UserRepository users;

	@Override
	public OAuth2TokenValidatorResult validate(Jwt jwt) {
		return users.existsByIdAndEnabledTrue(Long.valueOf(jwt.getSubject())) ? OAuth2TokenValidatorResult.success()
				: OAuth2TokenValidatorResult.failure(new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN));
	}

}
