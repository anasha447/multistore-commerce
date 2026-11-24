package com.ecommerce.store.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** A refusal the caller may see: status, message and, where the client must react, a code. */
@Getter
public class ApiException extends RuntimeException {

	private final HttpStatus status;

	private final String code;

	public ApiException(HttpStatus status, String message, String code) {
		super(message);
		this.status = status;
		this.code = code;
	}

	public static ApiException badRequest(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, message, null);
	}

	public static ApiException unauthorized(String message) {
		return new ApiException(HttpStatus.UNAUTHORIZED, message, null);
	}

	/** Missing, or not the caller's. Both look the same from outside. */
	public static ApiException notFound(String message) {
		return new ApiException(HttpStatus.NOT_FOUND, message, null);
	}

	public static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, message, null);
	}

}
