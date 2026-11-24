package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;

import com.ecommerce.store.config.StoreProperties;

class ClientAddressTests {

	private final ClientAddress addresses = new ClientAddress(new StoreProperties("matessa", "", "", "localhost", true, 100, 1));

	@Test
	void theStorefrontSpeaksForTheShopper() {
		assertThat(addresses.of(from("127.0.0.1", "203.0.113.7"))).contains("203.0.113.7");
		assertThat(addresses.of(from("127.0.0.1", "2001:db8::1"))).contains("2001:db8:0:0:0:0:0:1");
	}

	@Test
	void nobodyElseDoes() {
		assertThat(addresses.of(from("10.0.0.9", "203.0.113.7"))).contains("10.0.0.9");
		assertThat(addresses.of(from("10.0.0.9", null))).contains("10.0.0.9");
		ClientAddress nobodyTrusted = new ClientAddress(new StoreProperties("matessa", "", "", "", true, 100, 1));
		assertThat(nobodyTrusted.of(from("127.0.0.1", "203.0.113.7"))).contains("127.0.0.1");
		ClientAddress unknownName = new ClientAddress(new StoreProperties("matessa", "", "", "no-such-host.invalid", true, 100, 1));
		assertThat(unknownName.of(from("127.0.0.1", "203.0.113.7"))).contains("127.0.0.1");
	}

	@Test
	void pagesOfTheStorefrontHaveNoAddress() {
		assertThat(addresses.of(from("127.0.0.1", null))).isEmpty();
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "unknown", "203.0.113.7, 10.0.0.1", "203.0.113.7\r\nX: y", "evil.example.com", "dead.beef",
			"999.1.1.1", "1::2::3::4::5::6::7::8::9::a::b::c::d::e::f" })
	void whatIsNotOneAddressIsIgnored(String value) {
		assertThat(addresses.of(from("127.0.0.1", value))).isEmpty();
	}

	private static MockHttpServletRequest from(String remote, String forwarded) {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr(remote);
		if (forwarded != null) {
			request.addHeader("X-Forwarded-For", forwarded);
		}
		return request;
	}

}
