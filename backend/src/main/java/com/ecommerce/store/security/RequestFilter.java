package com.ecommerce.store.security;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.exception.ApiException;

/**
 * Names every request, refuses a storefront wired to the wrong app, and gives failures of any filter
 * the same error body as failures of a controller. Images need no store: browsers load them directly.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
class RequestFilter extends OncePerRequestFilter {

	private final StoreProperties store;

	private final RateLimiter rateLimiter;

	private final HandlerExceptionResolver handlerExceptionResolver;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String id = UUID.randomUUID().toString();
		response.setHeader("X-Request-Id", id);
		try (var ignored = MDC.putCloseable("requestId", id)) {
			answerFailures(request, response, chain);
		}
	}

	private void answerFailures(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		try {
			// the decoded, normalised path: a disguised /api path is still an /api path
			boolean image = request.getServletPath().startsWith("/media/");
			if (!image && !store.id().equals(request.getHeader("X-Tenant-ID"))) {
				throw ApiException.badRequest("Unknown store.");
			}
			// the storefront signs people out when a refresh fails, so a flood must not stop those
			if (!request.getServletPath().equals("/api/auth/refresh") && !rateLimiter.storeIsCalm()) {
				throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The shop is very busy. Please try again.", null);
			}
			chain.doFilter(request, response);
		}
		catch (Exception ex) {
			if (response.isCommitted()
					|| handlerExceptionResolver.resolveException(request, response, null, ex) == null) {
				throw ex;
			}
		}
	}

}
