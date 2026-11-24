package com.ecommerce.store.platform.web;

import jakarta.servlet.DispatcherType;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Closed until the access policy exists (sprint 2). No sessions, no cookies and no sign-in pages:
 * the caller is the storefront's server with a bearer token, so there is nothing for CSRF to abuse.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfiguration {

	/** Matches on the private management port only. */
	@Bean
	@Order(0)
	SecurityFilterChain management(HttpSecurity http) throws Exception {
		return http.securityMatcher(EndpointRequest.to("health", "metrics"))
			.csrf(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
			.build();
	}

	@Bean
	SecurityFilterChain api(HttpSecurity http, ErrorWriter errors) throws Exception {
		return http.csrf(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.logout(AbstractHttpConfigurer::disable)
			.requestCache(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(requests -> requests.dispatcherTypeMatchers(DispatcherType.ERROR)
				.permitAll()
				.anyRequest()
				.denyAll())
			.exceptionHandling(handling -> handling
				.authenticationEntryPoint(
						(request, response, ex) -> errors.write(request, response, HttpStatus.UNAUTHORIZED))
				.accessDeniedHandler((request, response, ex) -> errors.write(request, response, HttpStatus.FORBIDDEN)))
			.build();
	}

}
