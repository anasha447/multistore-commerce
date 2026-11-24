package com.ecommerce.store.identity.internal;

import com.ecommerce.store.platform.AccountGate;
import com.ecommerce.store.platform.CurrentUser;
import org.springframework.stereotype.Component;

/** Asks Postgres for every account until the deny keys exist. */
@Component
class ActiveAccounts implements AccountGate {

	private final UserRepository users;

	ActiveAccounts(UserRepository users) {
		this.users = users;
	}

	@Override
	public boolean mayAct(CurrentUser user) {
		return users.isEnabled(user.id()).orElse(false);
	}

}
