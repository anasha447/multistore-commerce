package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import java.util.UUID;

import com.ecommerce.store.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class PasswordTests {

	private final PasswordEncoder encoder = new LongPasswordEncoder(new BCryptPasswordEncoder(4));

	@Test
	void theWholeLengthCounts() {
		String start = "a".repeat(80);
		String hash = encoder.encode(start + "1");
		assertThat(encoder.matches(start + "1", hash)).isTrue();
		assertThat(encoder.matches(start + "2", hash)).isFalse();
		String accented = "\u00e9".repeat(50);
		assertThat(encoder.matches(accented, encoder.encode(accented))).isTrue();
	}

	@ParameterizedTest
	@ValueSource(strings = { "password1", "PASSWORD1", "12345678", "iloveyou1" })
	void commonPasswordsAreRefused(String password) throws Exception {
		PasswordPolicy policy = new PasswordPolicy();
		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> policy.requireUncommon(password))
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
		assertThatCode(() -> policy.requireUncommon(UUID.randomUUID().toString())).doesNotThrowAnyException();
	}

}
