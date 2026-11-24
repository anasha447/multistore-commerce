package com.ecommerce.store.identity.internal;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.ecommerce.store.platform.ApiError;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** Hashing and the rules for new passwords (SECURITY.md, section 2). Slow on purpose: never call it inside a transaction. */
@Component
class Passwords {

	/** BCrypt reads no further than this. */
	private static final int BCRYPT_LIMIT = 72;

	private static final int SHORTEST_CHECKED = 8;

	private static final String LIST = "/com/nulabinc/zxcvbn/matchers/dictionaries/passwords.txt";

	private final BCryptPasswordEncoder bcrypt;

	private final String nobodysHash;

	private final Set<String> common = commonPasswords();

	Passwords(@Value("${store.passwords.strength:12}") int strength) {
		this.bcrypt = new BCryptPasswordEncoder(strength);
		this.nobodysHash = bcrypt.encode(UUID.randomUUID().toString());
	}

	String hash(String password) {
		return bcrypt.encode(prepare(password));
	}

	/** A null hash (no such account) takes as long as a real one and never matches. */
	boolean matches(String password, String hash) {
		boolean same = bcrypt.matches(prepare(password), (hash != null) ? hash : nobodysHash);
		return same && hash != null;
	}

	/** The length is checked by the request's own rules. */
	void requireUncommon(String password) {
		if (common.contains(password.toLowerCase(Locale.ROOT))) {
			throw ApiError.badRequest("This password is too common. Choose another one.");
		}
	}

	private static String prepare(String password) {
		byte[] bytes = password.getBytes(StandardCharsets.UTF_8);
		if (bytes.length <= BCRYPT_LIMIT) {
			return password;
		}
		try {
			return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}

	private static Set<String> commonPasswords() {
		try (InputStream in = Passwords.class.getResourceAsStream(LIST);
				BufferedReader lines = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
			return lines.lines()
				.map(line -> line.strip().split("\\s")[0].toLowerCase(Locale.ROOT))
				.filter(word -> word.length() >= SHORTEST_CHECKED)
				.collect(Collectors.toUnmodifiableSet());
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

}
