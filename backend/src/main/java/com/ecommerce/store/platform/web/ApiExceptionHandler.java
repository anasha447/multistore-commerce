package com.ecommerce.store.platform.web;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.exc.StreamConstraintsException;

import com.ecommerce.store.platform.ApiError;

/** Every refusal in one shape. */
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	private static final String INVALID = "Validation failed";

	@ExceptionHandler
	ResponseEntity<Object> refused(ApiError ex, HttpServletRequest request) {
		return body(ex.status(), ErrorResponse.of(ex.status(), ex.getMessage(), request.getRequestURI(), null, ex.code()));
	}

	@ExceptionHandler
	ResponseEntity<Object> invalid(ConstraintViolationException ex, HttpServletRequest request) {
		Map<String, String> fields = new LinkedHashMap<>();
		ex.getConstraintViolations()
			.forEach(violation -> fields.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage()));
		return invalid(fields, request.getRequestURI());
	}

	@ExceptionHandler
	ResponseEntity<Object> unknownSort(PropertyReferenceException ex, HttpServletRequest request) {
		return plain(HttpStatus.BAD_REQUEST, "Unknown sort field: " + ex.getPropertyName(), request);
	}

	@ExceptionHandler({ ConcurrencyFailureException.class, DataIntegrityViolationException.class })
	ResponseEntity<Object> conflict(Exception ex, HttpServletRequest request) {
		if (valueDoesNotFit(ex)) {
			return plain(HttpStatus.BAD_REQUEST, ErrorTexts.message(HttpStatus.BAD_REQUEST), request);
		}
		log.warn("Conflict on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getClass().getSimpleName());
		return plain(HttpStatus.CONFLICT, ErrorTexts.message(HttpStatus.CONFLICT), request);
	}

	@ExceptionHandler({ CannotCreateTransactionException.class, DataAccessResourceFailureException.class })
	ResponseEntity<Object> databaseDown(Exception ex, HttpServletRequest request) {
		log.error("Database unavailable", ex);
		return plain(HttpStatus.SERVICE_UNAVAILABLE, ErrorTexts.message(HttpStatus.SERVICE_UNAVAILABLE), request);
	}

	/** Spring Security answers these itself. */
	@ExceptionHandler({ AccessDeniedException.class, AuthenticationException.class })
	void leaveToSecurity(RuntimeException ex) {
		throw ex;
	}

	@ExceptionHandler
	ResponseEntity<Object> unexpected(Exception ex, HttpServletRequest request) {
		log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
		return plain(HttpStatus.INTERNAL_SERVER_ERROR, ErrorTexts.message(HttpStatus.INTERNAL_SERVER_ERROR), request);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
			HttpStatusCode status, WebRequest request) {
		Map<String, String> fields = new LinkedHashMap<>();
		for (FieldError error : ex.getFieldErrors()) {
			fields.putIfAbsent(error.getField(), error.getDefaultMessage());
		}
		return invalid(fields, path(request));
	}

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, String> fields = new LinkedHashMap<>();
		ex.getParameterValidationResults()
			.forEach(result -> result.getResolvableErrors()
				.forEach(error -> fields.putIfAbsent(result.getMethodParameter().getParameterName(),
						error.getDefaultMessage())));
		return invalid(fields, path(request));
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpHeaders headers,
			HttpStatusCode status, WebRequest request) {
		HttpStatus actual = (ex.getRootCause() instanceof StreamConstraintsException) ? HttpStatus.CONTENT_TOO_LARGE
				: HttpStatus.BAD_REQUEST;
		return body(actual, ErrorResponse.of(actual, ErrorTexts.message(actual), path(request)));
	}

	/** Everything else Spring MVC refuses: wrong method, type, parameter, path, upload size. */
	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object ignored, HttpHeaders headers,
			HttpStatusCode status, WebRequest request) {
		ErrorResponse error = ErrorResponse.of(status, ErrorTexts.message(status), path(request));
		return ResponseEntity.status(status).headers(headers).contentType(MediaType.APPLICATION_JSON).body(error);
	}

	/** SQLSTATE class 22: too long for its column, or characters Postgres cannot store. */
	private static boolean valueDoesNotFit(Throwable ex) {
		return NestedExceptionUtils.getMostSpecificCause(ex) instanceof SQLException sql && sql.getSQLState() != null
				&& sql.getSQLState().startsWith("22");
	}

	private static ResponseEntity<Object> invalid(Map<String, String> fields, String path) {
		return body(HttpStatus.BAD_REQUEST, ErrorResponse.of(HttpStatus.BAD_REQUEST, INVALID, path, fields, null));
	}

	private static ResponseEntity<Object> plain(HttpStatus status, String message, HttpServletRequest request) {
		return body(status, ErrorResponse.of(status, message, request.getRequestURI()));
	}

	private static ResponseEntity<Object> body(HttpStatus status, ErrorResponse error) {
		return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(error);
	}

	private static String path(WebRequest request) {
		return ((ServletWebRequest) request).getRequest().getRequestURI();
	}

}
