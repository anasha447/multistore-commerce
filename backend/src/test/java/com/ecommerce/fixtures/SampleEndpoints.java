package com.ecommerce.fixtures;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.ecommerce.store.exception.ApiException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.filter.OncePerRequestFilter;

/** Open endpoints under /api/sample for tests of what every endpoint shares. */
@TestConfiguration(proxyBeanMethods = false)
@Import(SampleEndpoints.Controller.class)
public class SampleEndpoints {

	public record Nested(@NotBlank String postalCode) {
	}

	public record Input(@NotBlank String name, @Valid Nested shippingAddress, boolean isDefault, int displayOrder,
			BigDecimal price, Instant at) {
	}

	public record Output(Long id, String missing, BigDecimal price, BigDecimal big, Instant at, boolean isDefault,
			boolean primary, List<String> items) {
	}

	@Bean
	@Order(1)
	SecurityFilterChain openSample(HttpSecurity http) throws Exception {
		return http.securityMatcher("/api/sample/**")
			.csrf(AbstractHttpConfigurer::disable)
			.authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
			.build();
	}

	@Bean
	OncePerRequestFilter failingFilter() {
		return new OncePerRequestFilter() {

			@Override
			protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
					throws ServletException, IOException {
				if (request.getRequestURI().equals("/api/sample/broken-filter")) {
					throw new IllegalStateException("select secret from table");
				}
				if (request.getRequestURI().equals("/api/sample/database-in-filter")) {
					throw new DataAccessResourceFailureException("10.0.0.5 refused");
				}
				chain.doFilter(request, response);
			}
		};
	}

	@RestController
	@RequestMapping("/api/sample")
	static class Controller {

		@GetMapping("/output")
		Output output() {
			return new Output(1_234_567_890_123_456L, null, new BigDecimal("499.00"), new BigDecimal("1E+7"),
					Instant.parse("2026-11-24T10:15:30Z"), true, false, List.of());
		}

		@PostMapping("/input")
		Input input(@Valid @RequestBody Input input) {
			return input;
		}

		@GetMapping("/page")
		Page<String> page(Pageable pageable) {
			return new PageImpl<>(List.of("size=" + pageable.getPageSize()), pageable, 1);
		}

		@GetMapping("/limit")
		int limit(@RequestParam @Max(100) int limit) {
			return limit;
		}

		@GetMapping("/fail/{kind}")
		void fail(@PathVariable String kind) {
			throw switch (kind) {
				case "not-found" -> ApiException.notFound("Cart item not found: 5");
				case "code" -> new ApiException(HttpStatus.CONFLICT, "Still being placed", "REQUEST_IN_PROGRESS");
				case "stale" -> new OptimisticLockingFailureException("row 5 of orders");
				case "duplicate" -> new DataIntegrityViolationException("uk_users_email");
				case "database" -> new DataAccessResourceFailureException("10.0.0.5 refused");
				default -> new IllegalStateException("password=hunter2 in com.ecommerce.Secret");
			};
		}

	}

}
