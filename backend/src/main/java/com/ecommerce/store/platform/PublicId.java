package com.ecommerce.store.platform;

import java.security.SecureRandom;

/**
 * Ids that leave the app: random, always 16 digits, inside the whole numbers JavaScript can hold
 * (ADR-0014). An id names a thing; it has no order and grants nothing.
 */
public final class PublicId {

	public static final long MIN = 1_000_000_000_000_000L;

	public static final long MAX = 9_007_199_254_740_991L;

	private static final SecureRandom RANDOM = new SecureRandom();

	private PublicId() {
	}

	public static long next() {
		return RANDOM.nextLong(MIN, MAX + 1);
	}

}
