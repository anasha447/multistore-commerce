package com.ecommerce.store.platform.security;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.ecommerce.store.platform.AccountGate;
import com.ecommerce.store.platform.CurrentUser;
import com.ecommerce.store.platform.Role;
import com.ecommerce.store.platform.StoreId;
import com.nimbusds.jwt.JWTParser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

/** From a verified token to the caller. */
@Component
class TokenAuthentication implements Converter<Jwt, AbstractAuthenticationToken> {

	private final ObjectProvider<AccountGate> gate;

	private final StoreId store;

	TokenAuthentication(ObjectProvider<AccountGate> gate, StoreId store) {
		this.gate = gate;
		this.store = store;
	}

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) throws AuthenticationException {
		Set<Role> roles = Optional.ofNullable(jwt.getClaimAsStringList(TokenConfiguration.ROLES))
			.orElse(List.of())
			.stream()
			.map(Role::valueOf)
			.collect(Collectors.toUnmodifiableSet());
		CurrentUser user = new CurrentUser(Long.parseLong(jwt.getSubject()), roles);
		if (!gate.getObject().mayAct(user)) {
			throw new InvalidBearerTokenException("The account may not act");
		}
		return UsernamePasswordAuthenticationToken.authenticated(user, null, Permission.of(roles));
	}

	/**
	 * Every store has its own key, so another store's token fails the signature like any forged one.
	 * Its unverified store name only chooses between two refusals: 403 for another store, else 401.
	 */
	boolean namesAnotherStore(HttpServletRequest request) {
		String header = request.getHeader("Authorization");
		if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return false;
		}
		try {
			String named = JWTParser.parse(header.substring(7).strip())
				.getJWTClaimsSet()
				.getStringClaim(TokenConfiguration.TENANT);
			return named != null && !named.equals(store.value());
		}
		catch (Exception ex) {
			return false;
		}
	}

}
