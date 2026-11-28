package com.ecommerce.store.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import com.ecommerce.store.config.StoreProperties;
import com.ecommerce.store.service.interfaces.UserService;

/** Creates the first admin from the settings while there is none. Never changes an existing account. */
@Slf4j
@Component
@RequiredArgsConstructor
class AdminSeeder implements ApplicationRunner {

	private final UserService userService;

	private final StoreProperties store;

	private final Environment environment;

	@Override
	public void run(ApplicationArguments args) {
		if (userService.adminExists()) {
			return;
		}
		if (!StringUtils.hasText(store.adminEmail()) || !StringUtils.hasText(store.adminPassword())) {
			Assert.state(!environment.matchesProfiles("prod"), "There is no admin yet: set ADMIN_EMAIL and ADMIN_PASSWORD");
			log.warn("There is no admin and none is configured");
			return;
		}
		Assert.state(store.adminPassword().length() >= 8 && store.adminPassword().length() <= 100,
				"ADMIN_PASSWORD must have 8 to 100 characters");
		userService.createFirstAdmin(store.adminEmail(), store.adminPassword());
		log.info("Created the first admin");
	}

}
