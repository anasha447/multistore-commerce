package com.ecommerce.store.platform.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.core.io.Resource;

/**
 * This store's key pair, from PEM files. The public file may hold several keys: during a rotation
 * the old one stays until the last token signed with it has expired. A key's id is its thumbprint.
 */
record JwtKeys(RSAKey signing, JWKSet verifying) {

	private static final int SMALLEST = 2048;

	static JwtKeys load(Resource privateKey, Resource publicKeys) {
		try {
			KeyFactory rsa = KeyFactory.getInstance("RSA");
			byte[] secret = blocks(privateKey, "PRIVATE KEY").getFirst();
			RSAPrivateCrtKey own = (RSAPrivateCrtKey) rsa.generatePrivate(new PKCS8EncodedKeySpec(secret));
			RSAPublicKey ownPublic = (RSAPublicKey) rsa
				.generatePublic(new RSAPublicKeySpec(own.getModulus(), own.getPublicExponent()));
			RSAKey signing = key(ownPublic).privateKey(own).build();
			List<JWK> verifying = new ArrayList<>();
			for (byte[] block : blocks(publicKeys, "PUBLIC KEY")) {
				verifying.add(key((RSAPublicKey) rsa.generatePublic(new X509EncodedKeySpec(block))).build());
			}
			if (verifying.stream().noneMatch(key -> key.getKeyID().equals(signing.getKeyID()))) {
				throw new IllegalStateException("JWT_PUBLIC_KEYS does not hold the public half of JWT_PRIVATE_KEY");
			}
			return new JwtKeys(signing, new JWKSet(verifying));
		}
		catch (GeneralSecurityException | JOSEException | IOException ex) {
			throw new IllegalStateException("The JWT keys cannot be read", ex);
		}
	}

	private static RSAKey.Builder key(RSAPublicKey key) throws JOSEException {
		if (key.getModulus().bitLength() < SMALLEST) {
			throw new IllegalStateException("A JWT key has fewer than " + SMALLEST + " bits");
		}
		return new RSAKey.Builder(key).algorithm(JWSAlgorithm.RS256).keyUse(KeyUse.SIGNATURE).keyIDFromThumbprint();
	}

	private static List<byte[]> blocks(Resource file, String kind) throws IOException {
		Matcher block = Pattern.compile("-----BEGIN " + kind + "-----([^-]+)-----END " + kind + "-----")
			.matcher(file.getContentAsString(StandardCharsets.US_ASCII));
		List<byte[]> found = new ArrayList<>();
		while (block.find()) {
			found.add(Base64.getMimeDecoder().decode(block.group(1)));
		}
		if (found.isEmpty()) {
			throw new IllegalStateException("No " + kind + " in " + file.getDescription());
		}
		return found;
	}

}
