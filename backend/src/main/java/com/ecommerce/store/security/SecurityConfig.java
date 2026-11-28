package com.ecommerce.store.security;

import static org.springframework.http.HttpMethod.DELETE;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.HttpMethod.PUT;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;

import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.Assert;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;

/**
 * No sessions, no cookies and no sign-in pages: the caller is the storefront's server with a bearer
 * token, so there is nothing for CSRF to abuse. Roles and the token's signature, expiry and audience
 * are checked by the resource server, see spring.security.oauth2 in application.yaml.
 */
@Configuration
class SecurityConfig {

	/** Matches on the private management port only. */
	@Bean
	@Order(0)
	SecurityFilterChain managementSecurity(HttpSecurity http) {
		return http.securityMatcher(EndpointRequest.to("health", "metrics"))
			.authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
			.build();
	}

	@Bean
	SecurityFilterChain apiSecurity(HttpSecurity http, JwtService jwt, HandlerExceptionResolver handlerExceptionResolver) {
		AuthenticationEntryPoint refuse = (request, response, ex) -> handlerExceptionResolver.resolveException(request,
				response, null, jwt.namesAnotherStore(request) ? new AccessDeniedException("another store") : ex);
		return http.csrf(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(SecurityConfig::accessPolicy)
			// a bad token is 401 on public paths too: the storefront refreshes on that answer
			.oauth2ResourceServer(server -> server.authenticationEntryPoint(refuse).jwt(Customizer.withDefaults()))
			.exceptionHandling(handling -> handling.authenticationEntryPoint(refuse)
				.accessDeniedHandler((request, response, ex) -> handlerExceptionResolver.resolveException(request,
						response, null, ex)))
			.build();
	}

	/**
	 * Who may call what. The first matching line decides, the last one closes everything else. Ownership is
	 * checked by the services. A test compares all 91 documented endpoints with it.
	 */
	private static void accessPolicy(
			AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry requests) {
		String[] staff = { Role.MANAGER.name(), Role.ADMIN.name() };
		String admin = Role.ADMIN.name();

		requests.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll();

		// admin
		requests.requestMatchers("/api/admin/users/**").hasRole(admin);
		requests.requestMatchers(GET, "/api/analytics/customers").hasRole(admin);

		// staff
		requests.requestMatchers(GET, "/api/orders/admin", "/api/contact", "/api/subscribers", "/api/analytics/**",
				"/api/coupons", "/api/coupons/*")
			.hasAnyRole(staff);
		requests.requestMatchers(PUT, "/api/orders/*/status", "/api/orders/*/shipping").hasAnyRole(staff);
		requests.requestMatchers(PATCH, "/api/contact/*/status").hasAnyRole(staff);
		requests
			.requestMatchers(POST, "/api/categories", "/api/products", "/api/products/*/images",
					"/api/products/*/images/upload", "/api/products/*/variants", "/api/coupons", "/api/discounts")
			.hasAnyRole(staff);
		for (HttpMethod change : List.of(PUT, DELETE)) {
			requests
				.requestMatchers(change, "/api/categories/*", "/api/products/*", "/api/variants/*", "/api/images/*",
						"/api/coupons/*", "/api/discounts/*")
				.hasAnyRole(staff);
		}

		// everyone
		requests
			.requestMatchers(GET, "/media/*/*", "/api/categories/**", "/api/products/**", "/api/variants/*",
					"/api/discounts/*", "/api/orders/payment-methods", "/api/orders/track")
			.permitAll();
		requests
			.requestMatchers(POST, "/api/auth/*", "/api/coupons/validate", "/api/contact", "/api/subscribers",
					"/api/cart/price", "/api/orders/guest")
			.permitAll();

		// signed in
		requests.requestMatchers("/api/users/me/**", "/api/cart/**", "/api/wishlist/**").authenticated();
		requests.requestMatchers(GET, "/api/orders", "/api/orders/*", "/api/orders/by-number/*", "/api/orders/*/history")
			.authenticated();
		requests.requestMatchers(POST, "/api/orders", "/api/orders/*/cancel", "/api/products/*/reviews").authenticated();
		requests.requestMatchers(PUT, "/api/reviews/*").authenticated();
		requests.requestMatchers(DELETE, "/api/reviews/*").authenticated();

		requests.anyRequest().denyAll();
	}

	/** Added to the resource server's checks, like ActiveAccountValidator. */
	@Bean
	OAuth2TokenValidator<Jwt> issuedByThisStore(StoreProperties store) {
		return new JwtIssuerValidator(store.id());
	}

	@Bean
	PasswordEncoder passwordEncoder(@Value("${store.password-strength:12}") int strength) {
		return new LongPasswordEncoder(new BCryptPasswordEncoder(strength));
	}

	@Bean
	UserDetailsService userDetailsService(UserRepository users) {
		return email -> users.findByEmail(User.normaliseEmail(email))
			.orElseThrow(() -> new UsernameNotFoundException("unknown"));
	}

	/** Disabled and locked accounts are refused after the password check, so they take as long as any other failure. */
	@Bean
	AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder encoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
		provider.setPasswordEncoder(encoder);
		provider.setPreAuthenticationChecks(user -> {
		});
		return new ProviderManager(provider);
	}

	@Bean
	JwtEncoder jwtEncoder(@Value("${JWT_PUBLIC_KEY}") RSAPublicKey publicKey,
			@Value("${JWT_PRIVATE_KEY}") RSAPrivateKey privateKey) {
		Assert.state(publicKey.getModulus().bitLength() >= 2048, "The JWT key needs 2048 bits or more");
		Assert.state(publicKey.getModulus().equals(privateKey.getModulus()), "The JWT keys do not belong together");
		return NimbusJwtEncoder.withKeyPair(publicKey, privateKey).build();
	}

}
