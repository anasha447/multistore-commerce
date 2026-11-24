package com.ecommerce.store.security;

import java.security.Principal;
import java.util.Arrays;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import com.ecommerce.store.model.enums.RateLimitRule;

/** Runs after the access check, so the account is known. */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

	private final RateLimiter limiter;

	private final ClientAddress clientAddress;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		caller(request, false).ifPresent(who -> limiter.look(RateLimitRule.PROBE, who));
		for (RateLimitRule rule : rules(request, handler)) {
			caller(request, rule.isByAddress()).ifPresent(who -> limiter.check(rule, who));
		}
		return true;
	}

	/** Guessing ids shows as many answers of 404. */
	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
		if (response.getStatus() == HttpServletResponse.SC_NOT_FOUND) {
			caller(request, false).ifPresent(who -> limiter.count(RateLimitRule.PROBE, who));
		}
	}

	private static RateLimitRule[] rules(HttpServletRequest request, Object handler) {
		RateLimited own = (handler instanceof HandlerMethod method) ? method.getMethodAnnotation(RateLimited.class) : null;
		if (own != null) {
			return own.value();
		}
		return HttpMethod.GET.matches(request.getMethod()) ? new RateLimitRule[0] : new RateLimitRule[] { RateLimitRule.WRITE };
	}

	/** Nobody, for pages the storefront renders for a guest: they come without an address. */
	private Optional<String> caller(HttpServletRequest request, boolean byAddress) {
		Principal account = request.getUserPrincipal();
		if (account != null && !byAddress) {
			return Optional.of("u:" + account.getName());
		}
		return clientAddress.of(request).map(RateLimitInterceptor::network);
	}

	/** One IPv6 customer has a whole /64 to choose addresses from. */
	private static String network(String address) {
		String[] parts = address.split(":");
		return (parts.length == 8) ? String.join(":", Arrays.copyOf(parts, 4)) : address;
	}

}
