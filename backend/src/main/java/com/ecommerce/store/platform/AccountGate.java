package com.ecommerce.store.platform;

/** Asked on every request with a valid token: may this account still act? */
public interface AccountGate {

	boolean mayAct(CurrentUser user);

}
