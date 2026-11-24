package com.ecommerce.store.model.enums;

import org.springframework.security.core.GrantedAuthority;

/** Usable directly as an authority by Spring Security. */
public enum Role implements GrantedAuthority {

	ADMIN, MANAGER, CUSTOMER;

	@Override
	public String getAuthority() {
		return "ROLE_" + name();
	}

}
