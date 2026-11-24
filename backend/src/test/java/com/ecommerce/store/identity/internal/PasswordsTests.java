package com.ecommerce.store.identity.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import com.ecommerce.store.platform.ApiError;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PasswordsTests {

	private final Passwords passwords = new Passwords(4);

	@Test
	void aPasswordMatchesItsOwnHashOnly() {
		String hash = passwords.hash("correct horse battery");
		assertThat(passwords.matches("correct horse battery", hash)).isTrue();
		assertThat(passwords.matches("correct horse batterY", hash)).isFalse();
		assertThat(passwords.hash("correct horse battery")).isNotEqualTo(hash);
	}

	@Test
	void theWholeLengthCounts() {
		String start = "a".repeat(80);
		String hash = passwords.hash(start + "1");
		assertThat(passwords.matches(start + "1", hash)).isTrue();
		assertThat(passwords.matches(start + "2", hash)).isFalse();
		String accented = "é".repeat(50);
		assertThat(passwords.matches(accented, passwords.hash(accented))).isTrue();
	}

	@Test
	void nobodyNeverMatches() {
		assertThat(passwords.matches("anything", null)).isFalse();
	}

	@Test
	void productionStrengthIsTwelve() {
		assertThat(new Passwords(12).hash("x")).startsWith("$2a$12$");
	}

	@ParameterizedTest
	@ValueSource(strings = { "password1", "PASSWORD1", "12345678", "iloveyou1" })
	void commonPasswordsAreRefused(String password) {
		assertThatExceptionOfType(ApiError.class).isThrownBy(() -> passwords.requireUncommon(password))
			.satisfies(ex -> assertThat(ex.status().value()).isEqualTo(400));
	}

	@Test
	void otherPasswordsAreAccepted() {
		assertThatCode(() -> passwords.requireUncommon("masala-mate-2026!")).doesNotThrowAnyException();
	}

}
