package com.ecommerce.store.model.enums;

import java.time.Duration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** How often, and counted by what (SECURITY.md, section 4). */
@Getter
@RequiredArgsConstructor
public enum RateLimitRule {

	LOGIN(20, Duration.ofMinutes(1), true),
	LOGIN_ACCOUNT(10, Duration.ofMinutes(15), false),
	REGISTER(5, Duration.ofMinutes(1), true),
	REGISTER_DAY(30, Duration.ofDays(1), true),
	REFRESH(10, Duration.ofMinutes(1), false),
	CHECKOUT(10, Duration.ofMinutes(1), false),
	TRACK(20, Duration.ofMinutes(1), true),
	PRICE(120, Duration.ofMinutes(1), false),
	COUPON(20, Duration.ofMinutes(1), false),
	FORM(5, Duration.ofMinutes(1), true),
	FORM_DAY(30, Duration.ofDays(1), true),
	REVIEW(5, Duration.ofMinutes(1), false),
	UPLOAD(30, Duration.ofMinutes(1), false),
	PASSWORD(5, Duration.ofMinutes(15), false),
	PROBE(120, Duration.ofMinutes(5), false),
	WRITE(120, Duration.ofMinutes(1), false);

	private final int limit;

	private final Duration window;

	/** Counted by address even when the caller is signed in. */
	private final boolean byAddress;

}
