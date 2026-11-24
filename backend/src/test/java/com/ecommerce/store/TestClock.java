package com.ecommerce.store;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** The app's clock in tests: real time plus whatever a test moved it. Tests that move it reset it. */
public class TestClock extends Clock {

	private volatile Duration moved = Duration.ZERO;

	public void advance(Duration by) {
		moved = moved.plus(by);
	}

	public void reset() {
		moved = Duration.ZERO;
	}

	@Override
	public Instant instant() {
		return Instant.now().plus(moved);
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		return this;
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class Configuration {

		@Bean
		@Primary
		TestClock testClock() {
			return new TestClock();
		}

	}

}
