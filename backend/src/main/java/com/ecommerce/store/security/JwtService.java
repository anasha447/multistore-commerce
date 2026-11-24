package com.ecommerce.store.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import com.nimbusds.jwt.JWTParser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.stereotype.Service;

import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;

/** Issues access tokens. Checking them is the resource server's job. */
@Service
@RequiredArgsConstructor
public class JwtService {

	public static final Duration LIFETIME = Duration.ofMinutes(15);

	private final JwtEncoder encoder;

	private final StoreProperties store;

	private final Clock clock;

	/** While the password must be changed the token carries no roles. */
	public String issue(User user) {
		Instant now = clock.instant();
		return encoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
			.issuer(store.id())
			.audience(List.of(store.id()))
			.subject(user.getId().toString())
			.claim("roles", user.isMustChangePassword() ? List.of() : user.getRoles().stream().map(Role::name).sorted().toList())
			.claim("tenant", store.id())
			.claim("pwd_change", user.isMustChangePassword())
			.issuedAt(now)
			.expiresAt(now.plus(LIFETIME))
			.build())).getTokenValue();
	}

	/**
	 * Every store has its own key, so another store's token fails its signature like any forged one.
	 * The unverified name only chooses the refusal: 403 for another store, else 401.
	 */
	boolean namesAnotherStore(HttpServletRequest request) {
		try {
			String token = new DefaultBearerTokenResolver().resolve(request);
			String named = JWTParser.parse(token).getJWTClaimsSet().getStringClaim("tenant");
			return named != null && !named.equals(store.id());
		}
		catch (Exception ex) {
			return false;
		}
	}

}
