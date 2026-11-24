package com.ecommerce.store.platform.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

import com.ecommerce.store.platform.AccessTokens;
import com.ecommerce.store.platform.Role;
import com.ecommerce.store.platform.StoreId;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration(proxyBeanMethods = false)
class TokenConfiguration {

	static final String TENANT = "tenant";

	static final String ROLES = "roles";

	@Bean
	JwtKeys jwtKeys(@Value("${JWT_PRIVATE_KEY}") Resource privateKey, @Value("${JWT_PUBLIC_KEYS}") Resource publicKeys) {
		return JwtKeys.load(privateKey, publicKeys);
	}

	@Bean
	JwtDecoder jwtDecoder(JwtKeys keys, StoreId store, Clock clock, @Value("${JWT_ISSUER}") String issuer) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSource(new ImmutableJWKSet<>(keys.verifying()))
			.jwsAlgorithm(SignatureAlgorithm.RS256)
			.build();
		JwtTimestampValidator time = new JwtTimestampValidator(Duration.ZERO);
		time.setClock(clock);
		OAuth2TokenValidator<Jwt> ours = jwt -> {
			boolean complete = jwt.getExpiresAt() != null && store.value().equals(jwt.getClaimAsString(TENANT))
					&& jwt.getSubject() != null && jwt.getSubject().matches("\\d{16}");
			return complete ? OAuth2TokenValidatorResult.success()
					: OAuth2TokenValidatorResult.failure(new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN));
		};
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(List.of(time, new JwtIssuerValidator(issuer), ours)));
		return decoder;
	}

	@Bean
	AccessTokens accessTokens(JwtKeys keys, StoreId store, Clock clock, @Value("${JWT_ISSUER}") String issuer) {
		JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(keys.signing())));
		JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(keys.signing().getKeyID()).type("JWT").build();
		return (long userId, Collection<Role> roles, boolean passwordChangeRequired) -> {
			Instant now = clock.instant();
			JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(issuer)
				.subject(Long.toString(userId))
				.claim(ROLES, passwordChangeRequired ? List.of() : roles.stream().map(Role::name).sorted().toList())
				.claim(TENANT, store.value())
				.claim("pwd_change", passwordChangeRequired)
				.issuedAt(now)
				.expiresAt(now.plus(AccessTokens.LIFETIME))
				.build();
			return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
		};
	}

}
