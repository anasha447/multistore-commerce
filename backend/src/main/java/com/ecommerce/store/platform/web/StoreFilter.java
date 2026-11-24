package com.ecommerce.store.platform.web;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ecommerce.store.platform.StoreId;

/**
 * Refuses a storefront that is wired to the wrong app. Every path is checked except images, which
 * browsers load without our headers.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
class StoreFilter extends OncePerRequestFilter {

	static final String HEADER = "X-Tenant-ID";

	private final StoreId store;

	private final ErrorWriter errors;

	StoreFilter(StoreId store, ErrorWriter errors) {
		this.store = store;
		this.errors = errors;
	}

	/** The decoded, normalised path: a disguised /api path is still an /api path. */
	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return request.getServletPath().startsWith("/media/");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		if (!store.value().equals(request.getHeader(HEADER))) {
			errors.write(request, response, HttpStatus.BAD_REQUEST, "Unknown store.");
			return;
		}
		chain.doFilter(request, response);
	}

}
