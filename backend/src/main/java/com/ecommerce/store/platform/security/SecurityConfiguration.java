package com.ecommerce.store.platform.security;

import com.ecommerce.store.platform.web.ErrorWriter;
import jakarta.servlet.DispatcherType;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

/**
 * No sessions, no cookies and no sign-in pages: the caller is the storefront's server with a bearer
 * token, so there is nothing for CSRF to abuse.
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
	SecurityFilterChain everything(HttpSecurity http, ErrorWriter errors, TokenAuthentication tokens) throws Exception {
		AuthenticationEntryPoint notSignedIn = (request, response, ex) -> errors.write(request, response,
				tokens.namesAnotherStore(request) ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED);
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
			// a bad token is 401 on public paths too: the storefront refreshes on that answer
			.oauth2ResourceServer(server -> server.authenticationEntryPoint(notSignedIn)
				.jwt(jwt -> jwt.jwtAuthenticationConverter(tokens)))
			.exceptionHandling(handling -> handling.authenticationEntryPoint(notSignedIn)
				.accessDeniedHandler((request, response, ex) -> errors.write(request, response, HttpStatus.FORBIDDEN)))
			.build();
	}

}
