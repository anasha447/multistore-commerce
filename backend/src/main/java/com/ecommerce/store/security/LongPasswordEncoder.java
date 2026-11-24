package com.ecommerce.store.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

import lombok.SneakyThrows;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** BCrypt reads 72 bytes; longer passwords are hashed to fit first. */
record LongPasswordEncoder(BCryptPasswordEncoder bcrypt) implements PasswordEncoder {

	@Override
	public String encode(CharSequence password) {
		return bcrypt.encode(fit(password.toString()));
	}

	@Override
	public boolean matches(CharSequence password, String hash) {
		return bcrypt.matches(fit(password.toString()), hash);
	}

	@SneakyThrows
	private static String fit(String password) {
		byte[] bytes = password.getBytes(StandardCharsets.UTF_8);
		return (bytes.length <= 72) ? password
				: Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes));
	}

}
