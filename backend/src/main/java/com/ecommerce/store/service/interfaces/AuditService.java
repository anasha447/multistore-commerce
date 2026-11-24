package com.ecommerce.store.service.interfaces;

import com.ecommerce.store.model.User;

/** Who changed what. Written in the transaction of the change, so there is never one without the other. */
public interface AuditService {

	/** Pass responses, never entities: they hold hashes. */
	void record(String action, String entity, Long entityId, Object before, Object after);

	/** Staff only; shoppers are not recorded. */
	void recordSignIn(User user);

	/** Takes as long for an unknown email as for a known one. */
	void recordFailedSignIn(String email);

}
