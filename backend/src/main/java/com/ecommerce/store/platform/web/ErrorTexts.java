package com.ecommerce.store.platform.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

/** What to say when there is nothing more specific. Never a class name, a table or a stack trace. */
final class ErrorTexts {

	private ErrorTexts() {
	}

	static String title(HttpStatusCode status) {
		HttpStatus known = HttpStatus.resolve(status.value());
		return (known != null) ? known.getReasonPhrase() : "Error";
	}

	static String message(HttpStatusCode status) {
		return switch (status.value()) {
			case 400 -> "The request is not valid.";
			case 401 -> "Sign in to continue.";
			case 403 -> "You do not have access to this.";
			case 404 -> "Not found.";
			case 405 -> "This method is not supported here.";
			case 409 -> "This was changed by someone else. Reload and try again.";
			case 413 -> "The request is too large.";
			case 415 -> "This content type is not supported.";
			case 429 -> "Too many requests. Try again later.";
			case 503 -> "The service is unavailable at the moment. Please try again.";
			default -> status.is4xxClientError() ? "The request is not valid." : "Something went wrong. Please try again.";
		};
	}

}
