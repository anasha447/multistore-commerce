package com.ecommerce.store.config;

import java.time.Duration;

import tools.jackson.databind.JavaType;

/**
 * One cache: what it holds and for how long. Caches of a group are cleared together, by counting the
 * group's generation up: old entries are never read again and expire by themselves.
 */
record CacheSpec(String name, Duration lifetime, JavaType type, String group) {

	CacheSpec(String name, Duration lifetime, JavaType type) {
		this(name, lifetime, type, null);
	}

}
