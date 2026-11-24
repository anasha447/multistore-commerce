package com.ecommerce.store.platform;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class PlatformConfiguration {

	@Bean
	StoreId storeId(@Value("${STORE_ID}") String id) {
		return new StoreId(id);
	}

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
