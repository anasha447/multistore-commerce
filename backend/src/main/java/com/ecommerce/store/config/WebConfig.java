package com.ecommerce.store.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.ecommerce.store.security.RateLimitInterceptor;

@Configuration
@RequiredArgsConstructor
class WebConfig implements WebMvcConfigurer {

	private final RateLimitInterceptor rateLimitInterceptor;

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(rateLimitInterceptor);
	}

}
