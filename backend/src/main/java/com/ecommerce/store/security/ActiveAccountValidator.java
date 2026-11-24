package com.ecommerce.store.security;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;

/**
 * Asked for every token: a disabled account is refused on its next request. Postgres decides. Only for
 * shoppers, who are many, is it not asked while nothing speaks against them.
 */
@Component
@RequiredArgsConstructor
class ActiveAccountValidator implements OAuth2TokenValidator<Jwt> {

	private final UserRepository users;

	private final DeniedAccounts deniedAccounts;

	@Override
	public OAuth2TokenValidatorResult validate(Jwt jwt) {
		return jwt.getSubject().matches("[0-9]{16}") && mayAct(jwt) ? OAuth2TokenValidatorResult.success()
				: OAuth2TokenValidatorResult.failure(new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN));
	}

	private boolean mayAct(Jwt jwt) {
		Long id = Long.valueOf(jwt.getSubject());
		boolean shopper = List.of(Role.CUSTOMER.name()).equals(jwt.getClaimAsStringList("roles"));
		boolean unsuspected = shopper && !deniedAccounts.isSuspect(id).orElse(true);
		return unsuspected || users.existsByIdAndEnabledTrue(id);
	}

}
