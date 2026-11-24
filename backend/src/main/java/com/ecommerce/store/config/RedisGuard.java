package com.ecommerce.store.config;

import java.time.Duration;
import java.util.Optional;
import java.util.function.Supplier;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

/**
 * Redis makes the shop faster, never possible: when it is slow or gone, callers get nothing and go
 * another way. After a few failures it is not asked at all for a while.
 */
@Slf4j
@Component
public class RedisGuard {

	private final CircuitBreaker breaker = CircuitBreaker.of("redis", CircuitBreakerConfig.custom()
		.slidingWindowSize(10)
		.minimumNumberOfCalls(5)
		.waitDurationInOpenState(Duration.ofSeconds(5))
		.automaticTransitionFromOpenToHalfOpenEnabled(true)
		.build());

	RedisGuard() {
		breaker.getEventPublisher().onStateTransition(event -> log.warn("Redis: {}", event.getStateTransition()));
	}

	/** Empty when Redis did not answer. */
	public <T> Optional<T> ask(Supplier<T> command) {
		try {
			return Optional.ofNullable(breaker.executeSupplier(command));
		}
		catch (CallNotPermittedException | DataAccessException ex) {
			return Optional.empty();
		}
	}

}
