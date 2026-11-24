package com.ecommerce.store.platform;

import java.time.Duration;
import java.util.Collection;

/** Short-lived signed tokens. */
public interface AccessTokens {

	Duration LIFETIME = Duration.ofMinutes(15);

	/** While the password must be changed the token carries no roles. */
	String issue(long userId, Collection<Role> roles, boolean passwordChangeRequired);

}
