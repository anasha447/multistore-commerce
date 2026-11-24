package com.ecommerce.store.platform;

import java.util.Set;

/** Who is calling, taken from the verified token and nothing else. */
public record CurrentUser(long id, Set<Role> roles) {

}
