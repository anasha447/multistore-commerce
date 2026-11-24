package com.ecommerce.store.platform.web;

import java.sql.SQLTransientConnectionException;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Last resort for errors outside any controller. Same shape, no details, never HTML. */
@RestController
class ErrorEndpoint implements ErrorController {

	@RequestMapping("/error")
	ResponseEntity<ErrorResponse> error(HttpServletRequest request) {
		Object code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
		HttpStatus status = (code instanceof Integer number) ? HttpStatus.resolve(number) : HttpStatus.NOT_FOUND;
		if (isDatabaseDown(request.getAttribute(RequestDispatcher.ERROR_EXCEPTION))) {
			status = HttpStatus.SERVICE_UNAVAILABLE;
		}
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		Object path = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
		return ResponseEntity.status(status)
			.contentType(MediaType.APPLICATION_JSON)
			.body(ErrorResponse.of(status, ErrorTexts.message(status),
					(path != null) ? path.toString() : request.getRequestURI()));
	}

	/** Filters ask the database too, and their failures end up here. */
	private static boolean isDatabaseDown(Object error) {
		return error instanceof Throwable thrown
				&& (NestedExceptionUtils.getRootCause(thrown) instanceof SQLTransientConnectionException
						|| causedBy(thrown, DataAccessResourceFailureException.class)
						|| causedBy(thrown, CannotCreateTransactionException.class));
	}

	private static boolean causedBy(Throwable thrown, Class<? extends Throwable> type) {
		for (Throwable cause = thrown; cause != null; cause = cause.getCause()) {
			if (type.isInstance(cause)) {
				return true;
			}
		}
		return false;
	}

}
