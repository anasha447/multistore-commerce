package com.ecommerce.store.exception;

import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
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
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.exc.StreamConstraintsException;

import com.ecommerce.store.dto.response.ErrorResponse;

/** Every refusal in one shape, with nothing in it that describes the inside of the app. */
@Slf4j
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler
	ResponseEntity<Object> handle(ApiException ex, WebRequest request) {
		return answer(ex.getStatus(), ex.getMessage(), null, ex.getCode(), request);
	}

	@ExceptionHandler
	ResponseEntity<Object> handle(AuthenticationException ex, WebRequest request) {
		return answer(HttpStatus.UNAUTHORIZED, request);
	}

	@ExceptionHandler
	ResponseEntity<Object> handle(AccessDeniedException ex, WebRequest request) {
		return answer(HttpStatus.FORBIDDEN, request);
	}

	@ExceptionHandler
	ResponseEntity<Object> handle(PropertyReferenceException ex, WebRequest request) {
		return answer(HttpStatus.BAD_REQUEST, "Unknown sort field: " + ex.getPropertyName(), null, null, request);
	}

	/** SQLSTATE class 22: too long for its column, or characters Postgres cannot store. */
	@ExceptionHandler
	ResponseEntity<Object> handle(DataIntegrityViolationException ex, WebRequest request) {
		boolean unfit = ex.getMostSpecificCause() instanceof SQLException sql && sql.getSQLState() != null
				&& sql.getSQLState().startsWith("22");
		return answer(unfit ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT, request);
	}

	@ExceptionHandler
	ResponseEntity<Object> handle(ConcurrencyFailureException ex, WebRequest request) {
		return answer(HttpStatus.CONFLICT, request);
	}

	@ExceptionHandler({ CannotCreateTransactionException.class, DataAccessResourceFailureException.class,
			InternalAuthenticationServiceException.class })
	ResponseEntity<Object> handleDatabaseDown(Exception ex, WebRequest request) {
		log.error("Database unavailable", ex);
		return answer(HttpStatus.SERVICE_UNAVAILABLE, request);
	}

	@ExceptionHandler
	ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
		log.error("Unexpected error", ex);
		return answer(HttpStatus.INTERNAL_SERVER_ERROR, request);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, String> fields = new LinkedHashMap<>();
		ex.getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
		return answer(HttpStatus.BAD_REQUEST, "Validation failed", fields, null, request);
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		boolean tooLong = ex.getRootCause() instanceof StreamConstraintsException;
		return answer(tooLong ? HttpStatus.CONTENT_TOO_LARGE : HttpStatus.BAD_REQUEST, request);
	}

	/** Everything else Spring MVC refuses: method, type, parameter, path, upload size. */
	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode status, WebRequest request) {
		return answer(HttpStatus.valueOf(status.value()), request);
	}

	private static ResponseEntity<Object> answer(HttpStatus status, WebRequest request) {
		String message = switch (status) {
			case UNAUTHORIZED -> "Sign in to continue.";
			case FORBIDDEN -> "You do not have access to this.";
			case NOT_FOUND -> "Not found.";
			case CONFLICT -> "This was changed by someone else. Reload and try again.";
			case SERVICE_UNAVAILABLE -> "The service is unavailable at the moment. Please try again.";
			case INTERNAL_SERVER_ERROR -> "Something went wrong. Please try again.";
			default -> "The request is not valid.";
		};
		return answer(status, message, null, null, request);
	}

	private static ResponseEntity<Object> answer(HttpStatus status, String message, Map<String, String> fields,
			String code, WebRequest request) {
		String path = ((ServletWebRequest) request).getRequest().getRequestURI();
		return ResponseEntity.status(status)
			.contentType(MediaType.APPLICATION_JSON)
			.body(new ErrorResponse(Instant.now(), status.value(), status.getReasonPhrase(), message, path, fields, code));
	}

}
