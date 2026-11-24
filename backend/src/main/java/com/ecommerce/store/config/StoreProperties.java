package com.ecommerce.store.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/** The one store this copy of the app serves. */
@Validated
@ConfigurationProperties("store")
public record StoreProperties(@NotNull @Pattern(regexp = "[a-z][a-z0-9_]{1,30}") String id, String adminEmail,
		String adminPassword, String trustedCaller,
		@DefaultValue("true") boolean rateLimits, @DefaultValue("100") int requestsPerSecond,
		@DefaultValue("1") @Min(1) int copies) {
}
