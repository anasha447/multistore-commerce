package com.ecommerce.store.platform.web;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatusCode;

/** The only body that leaves null fields out (API-CONTRACT.md, section 1). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(Instant timestamp, int status, String error, String message, String path,
		Map<String, String> fieldErrors, String code) {

	public static ErrorResponse of(HttpStatusCode status, String message, String path) {
		return of(status, message, path, null, null);
	}

	public static ErrorResponse of(HttpStatusCode status, String message, String path, Map<String, String> fieldErrors,
			String code) {
		return new ErrorResponse(Instant.now(), status.value(), ErrorTexts.title(status), message, path, fieldErrors,
				code);
	}

}
