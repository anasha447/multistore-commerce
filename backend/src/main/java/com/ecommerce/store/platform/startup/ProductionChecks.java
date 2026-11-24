package com.ecommerce.store.platform.startup;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Profiles;
import org.springframework.util.StringUtils;

/** In production the app does not start with a blank, short or shared secret. Names are reported, never values. */
public class ProductionChecks implements EnvironmentPostProcessor, Ordered {

	private static final List<String> REQUIRED = List.of("STORE_ID", "STORE_NAME", "STORE_PUBLIC_URL", "DB_URL",
			"DB_APP_USER", "DB_APP_PASSWORD", "DB_OWNER_USER", "DB_OWNER_PASSWORD", "REDIS_HOST", "REDIS_USER",
			"REDIS_PASSWORD", "JWT_ISSUER", "JWT_PRIVATE_KEY", "JWT_PUBLIC_KEYS");

	private static final int SHORTEST_PASSWORD = 16;

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		if (!environment.acceptsProfiles(Profiles.of("prod"))) {
			return;
		}
		List<String> problems = new ArrayList<>();
		if (environment.acceptsProfiles(Profiles.of("local | demo | test"))) {
			problems.add("the prod profile cannot be combined with local, demo or test");
		}
		for (String name : REQUIRED) {
			String value = environment.getProperty(name);
			if (!StringUtils.hasText(value)) {
				problems.add(name + " is missing");
			}
			else if (name.endsWith("_PASSWORD") && value.length() < SHORTEST_PASSWORD) {
				problems.add(name + " is shorter than " + SHORTEST_PASSWORD + " characters");
			}
		}
		same(environment, problems, "DB_APP_USER", "DB_OWNER_USER");
		same(environment, problems, "DB_APP_PASSWORD", "DB_OWNER_PASSWORD");
		if (!problems.isEmpty()) {
			throw new IllegalStateException("Not starting: " + String.join("; ", problems));
		}
	}

	private static void same(ConfigurableEnvironment environment, List<String> problems, String first, String second) {
		String value = environment.getProperty(first);
		if (StringUtils.hasText(value) && value.equals(environment.getProperty(second))) {
			problems.add(first + " and " + second + " must differ");
		}
	}

	/** After the settings files are read. */
	@Override
	public int getOrder() {
		return ConfigDataEnvironmentPostProcessor.ORDER + 1;
	}

}
