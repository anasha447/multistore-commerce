package com.ecommerce.store.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class RateLimitException extends ApiException {

	private final long retryAfterSeconds;

	public RateLimitException(long retryAfterSeconds) {
		super(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again in a moment.", null);
		this.retryAfterSeconds = retryAfterSeconds;
	}

}
