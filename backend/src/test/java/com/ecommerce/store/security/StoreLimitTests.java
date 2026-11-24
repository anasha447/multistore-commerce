package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.ModelAndView;

import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.exception.ApiException;

class StoreLimitTests {

	private final StoreProperties store = new StoreProperties("matessa", "", "", "", true, 3);

	private final RateLimiter limiter = new RateLimiter(null, null, store,
			Clock.fixed(Instant.parse("2026-11-24T10:00:00Z"), ZoneOffset.UTC));

	private final List<Exception> refused = new ArrayList<>();

	private final RequestFilter filter = new RequestFilter(store, limiter, (request, response, handler, ex) -> {
		refused.add(ex);
		return new ModelAndView();
	});

	@Test
	void aFloodIsRefusedButNobodyIsSignedOut() throws Exception {
		for (int i = 0; i < 3; i++) {
			send("/api/products");
		}
		assertThat(refused).isEmpty();
		send("/api/products");
		assertThat(refused).singleElement()
			.isInstanceOfSatisfying(ApiException.class, ex -> assertThat(ex.getStatus().value()).isEqualTo(503));
		send("/api/auth/refresh");
		assertThat(refused).hasSize(1);
	}

	private void send(String path) throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
		request.setServletPath(path);
		request.addHeader("X-Tenant-ID", "matessa");
		filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
	}

}
