package com.ecommerce.store.security;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Optional;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.ecommerce.store.config.StoreProperties;

/**
 * Where a request really comes from. Only this store's own storefront may say so for someone else; what
 * any other caller claims is ignored. Pages rendered by the storefront itself come without an address.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClientAddress {

	private static final String BYTE = "(25[0-5]|2[0-4]\\d|1?\\d?\\d)";

	/** Never a name: parsing must not ask DNS. */
	private static final Pattern LITERAL = Pattern.compile(BYTE + "(\\." + BYTE + "){3}|[0-9a-fA-F:.]*:[0-9a-fA-F:.]*");

	private final StoreProperties store;

	public Optional<String> of(HttpServletRequest request) {
		if (!isStorefront(request.getRemoteAddr())) {
			return Optional.of(request.getRemoteAddr());
		}
		return Optional.ofNullable(request.getHeader("X-Forwarded-For"))
			.filter(address -> address.length() <= 45 && LITERAL.matcher(address).matches())
			.flatMap(ClientAddress::parse);
	}

	private static Optional<String> parse(String literal) {
		try {
			return Optional.of(InetAddress.getByName(literal).getHostAddress());
		}
		catch (UnknownHostException ex) {
			return Optional.empty();
		}
	}

	/** Container addresses change; Java remembers a name's address for half a minute. */
	private boolean isStorefront(String address) {
		if (!StringUtils.hasText(store.trustedCaller())) {
			return false;
		}
		try {
			return Arrays.asList(InetAddress.getAllByName(store.trustedCaller())).contains(InetAddress.getByName(address));
		}
		catch (UnknownHostException ex) {
			log.warn("The storefront's name cannot be resolved");
			return false;
		}
	}

}
