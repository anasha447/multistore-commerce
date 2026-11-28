package com.ecommerce.store.security;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Who is acting and from where, as plain values, so services never see the request or the token. Outside a
 * request (a job) there is no account and no address.
 */
@Component
@RequiredArgsConstructor
public class Caller {

	private final ClientAddress clientAddress;

	/** The signed-in account, from the verified token. */
	public Optional<Long> id() {
		return token().map(jwt -> Long.valueOf(jwt.getSubject()));
	}

	/** The roles the token carries, as "[ADMIN, MANAGER]". */
	public Optional<String> roles() {
		return token().map(jwt -> String.valueOf(Optional.ofNullable(jwt.getClaimAsStringList("roles")).orElse(List.of())));
	}

	public Optional<String> address() {
		return (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)
				? clientAddress.of(attributes.getRequest()) : Optional.empty();
	}

	public Optional<String> requestId() {
		return Optional.ofNullable(MDC.get("requestId"));
	}

	private static Optional<Jwt> token() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) ? Optional.of(jwt)
				: Optional.empty();
	}

}
