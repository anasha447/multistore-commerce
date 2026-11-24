package com.ecommerce.store.platform;

import org.springframework.http.HttpStatus;

/** A refusal the caller may see: status, message and, where the client must react, a code. */
public class ApiError extends RuntimeException {

	private final HttpStatus status;

	private final String code;

	public ApiError(HttpStatus status, String message, String code) {
		super(message);
		this.status = status;
		this.code = code;
	}

	public static ApiError badRequest(String message) {
		return new ApiError(HttpStatus.BAD_REQUEST, message, null);
	}

	public static ApiError unauthorized(String message) {
		return new ApiError(HttpStatus.UNAUTHORIZED, message, null);
	}

	/** Missing, or not the caller's. Both look the same from outside. */
	public static ApiError notFound(String message) {
		return new ApiError(HttpStatus.NOT_FOUND, message, null);
	}

	public static ApiError conflict(String message) {
		return new ApiError(HttpStatus.CONFLICT, message, null);
	}

	public static ApiError conflict(String message, String code) {
		return new ApiError(HttpStatus.CONFLICT, message, code);
	}

	public HttpStatus status() {
		return status;
	}

	public String code() {
		return code;
	}

}
