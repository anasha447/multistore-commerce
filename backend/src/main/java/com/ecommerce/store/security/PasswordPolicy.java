package com.ecommerce.store.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.ecommerce.store.exception.ApiException;

/** Refuses well-known passwords. Lengths are checked by the requests. */
@Component
public class PasswordPolicy {

	private final Set<String> common;

	PasswordPolicy() throws IOException {
		var list = new ClassPathResource("com/nulabinc/zxcvbn/matchers/dictionaries/passwords.txt");
		common = list.getContentAsString(StandardCharsets.UTF_8).lines().collect(Collectors.toUnmodifiableSet());
	}

	public void requireUncommon(String password) {
		if (common.contains(password.toLowerCase(Locale.ROOT))) {
			throw ApiException.badRequest("This password is too common. Choose another one.");
		}
	}

}
