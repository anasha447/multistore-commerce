package com.ecommerce.store.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.ecommerce.store.model.enums.RateLimitRule;

/** Rules for an endpoint, counted by the caller's account or address. Other writes fall under WRITE. */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

	RateLimitRule[] value();

}
