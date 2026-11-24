package com.ecommerce.store.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.util.Assert;

/** Production does not start with a blank or short password, or one role for two jobs. Values are never printed. */
@Configuration
@Profile("prod")
class ProductionCheck {

	ProductionCheck(Environment environment) {
		for (String name : List.of("DB_APP_PASSWORD", "DB_OWNER_PASSWORD", "REDIS_PASSWORD")) {
			Assert.state(environment.getProperty(name, "").strip().length() >= 16, name + " needs 16 characters or more");
		}
		Assert.state(!environment.getRequiredProperty("DB_APP_USER").equals(environment.getProperty("DB_OWNER_USER")),
				"DB_APP_USER and DB_OWNER_USER must differ");
		Assert.hasText(environment.getProperty("TRUSTED_CALLER"), "TRUSTED_CALLER must name the storefront");
		Assert.state(environment.getProperty("store.rate-limits", Boolean.class, true), "Rate limits must be on");
		Assert.state(environment.matchesProfiles("!local & !demo"), "prod cannot be combined with local or demo");
	}

}
