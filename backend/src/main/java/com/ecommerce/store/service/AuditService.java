package com.ecommerce.store.service;

import java.util.TreeSet;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.AuditRepository;
import com.ecommerce.store.security.ClientAddress;

/** Who changed what. Written in the transaction of the change, so there is never one without the other. */
@Service
@RequiredArgsConstructor
public class AuditService {

	private final AuditRepository audit;

	private final JsonMapper json;

	private final ClientAddress clientAddress;

	/** The current request; Spring injects a proxy. */
	private final HttpServletRequest request;

	/** Pass responses, never entities: they hold hashes. */
	@Transactional(propagation = Propagation.MANDATORY)
	public void record(String action, String entity, Long entityId, Object before, Object after) {
		Authentication caller = SecurityContextHolder.getContext().getAuthentication();
		String roles = ((Jwt) caller.getPrincipal()).getClaimAsStringList("roles").toString();
		add(Long.valueOf(caller.getName()), roles, action, entity, entityId, before, after);
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public void recordSignIn(User user) {
		if (user.getRoles().contains(Role.MANAGER) || user.getRoles().contains(Role.ADMIN)) {
			add(user.getId(), new TreeSet<>(user.getRoles()).toString(), "SIGN_IN", "user", user.getId(), null, null);
		}
	}

	@Transactional
	public void recordFailedSignIn(String email) {
		audit.addFailedStaffSignIn(User.normaliseEmail(email), clientIp(), MDC.get("requestId"));
	}

	private void add(Long actor, String roles, String action, String entity, Long entityId, Object before, Object after) {
		audit.add(actor, roles, action, entity, entityId.toString(), toJson(before), toJson(after),
				clientIp(), MDC.get("requestId"));
	}

	private String clientIp() {
		return clientAddress.of(request).orElse(null);
	}

	private String toJson(Object value) {
		return (value != null) ? json.writeValueAsString(value) : null;
	}

}
