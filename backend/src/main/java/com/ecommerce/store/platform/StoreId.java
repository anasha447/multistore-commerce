package com.ecommerce.store.platform;

import java.util.regex.Pattern;

/** The one store this copy of the app serves. */
public record StoreId(String value) {

	private static final Pattern VALID = Pattern.compile("[a-z][a-z0-9_]{1,30}");

	public StoreId {
		if (value == null || !VALID.matcher(value).matches()) {
			throw new IllegalArgumentException("STORE_ID must be lower case letters, digits or underscore");
		}
	}

	@Override
	public String toString() {
		return value;
	}

}
