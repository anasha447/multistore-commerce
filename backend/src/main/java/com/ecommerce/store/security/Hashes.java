package com.ecommerce.store.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import lombok.SneakyThrows;

public final class Hashes {

	private Hashes() {
	}

	@SneakyThrows
	public static String sha256(String value) {
		byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
		return HexFormat.of().formatHex(digest);
	}

}
