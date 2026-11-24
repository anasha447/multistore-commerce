package com.ecommerce.store.platform.security;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.ecommerce.store.platform.Role;
import org.springframework.security.core.GrantedAuthority;

/** What a role may do (SECURITY.md, section 3). To tighten a role, remove a line here. */
enum Permission implements GrantedAuthority {

	CATALOG_WRITE, STOCK_WRITE, PROMOTION_WRITE, ORDER_MANAGE, SUPPORT_READ, REVIEW_MODERATE, ANALYTICS_SALES,
	USER_MANAGE, ANALYTICS_CUSTOMERS;

	private static final Map<Role, Set<Permission>> GRANTED = Map.of(Role.CUSTOMER, EnumSet.noneOf(Permission.class),
			Role.MANAGER, EnumSet.complementOf(EnumSet.of(USER_MANAGE, ANALYTICS_CUSTOMERS)), Role.ADMIN,
			EnumSet.allOf(Permission.class));

	static Set<Permission> of(Collection<Role> roles) {
		Set<Permission> all = EnumSet.noneOf(Permission.class);
		roles.forEach(role -> all.addAll(GRANTED.get(role)));
		return all;
	}

	@Override
	public String getAuthority() {
		return name();
	}

}
