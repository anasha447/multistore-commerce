package com.ecommerce.store.platform.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** Writes the error body from places where no controller runs: filters and Spring Security. */
@Component
public class ErrorWriter {

	private final JsonMapper json;

	ErrorWriter(JsonMapper json) {
		this.json = json;
	}

	public void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status) throws IOException {
		write(request, response, status, ErrorTexts.message(status));
	}

	public void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status, String message)
			throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write(json.writeValueAsString(ErrorResponse.of(status, message, request.getRequestURI())));
	}

}
