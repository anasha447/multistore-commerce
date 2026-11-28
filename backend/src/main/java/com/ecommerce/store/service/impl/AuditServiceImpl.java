package com.ecommerce.store.service.impl;

import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.AuditRepository;
import com.ecommerce.store.security.Caller;
import com.ecommerce.store.service.interfaces.AuditService;

@Service
@RequiredArgsConstructor
class AuditServiceImpl implements AuditService {

	private final AuditRepository audit;

	private final JsonMapper json;

	private final Caller caller;

	@Override
	@Transactional(propagation = Propagation.MANDATORY)
	public void record(String action, String entity, Long entityId, Object before, Object after) {
		add(caller.id().orElse(null), caller.roles().orElse(null), action, entity, entityId, before, after);
	}

	@Override
	@Transactional(propagation = Propagation.MANDATORY)
	public void recordSignIn(User user) {
		if (user.getRoles().contains(Role.MANAGER) || user.getRoles().contains(Role.ADMIN)) {
			add(user.getId(), new TreeSet<>(user.getRoles()).toString(), "SIGN_IN", "user", user.getId(), null, null);
		}
	}

	@Override
	@Transactional
	public void recordFailedSignIn(String email) {
		audit.addFailedStaffSignIn(User.normaliseEmail(email), caller.address().orElse(null),
				caller.requestId().orElse(null));
	}

	private void add(Long actor, String roles, String action, String entity, Long entityId, Object before, Object after) {
		audit.add(actor, roles, action, entity, entityId.toString(), toJson(before), toJson(after),
				caller.address().orElse(null), caller.requestId().orElse(null));
	}

	private String toJson(Object value) {
		return (value != null) ? json.writeValueAsString(value) : null;
	}

}
