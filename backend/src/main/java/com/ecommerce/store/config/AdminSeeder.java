package com.ecommerce.store.config;

import java.util.Set;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.PasswordPolicy;

/** Creates the first admin from the settings while there is none. Never changes an existing account. */
@Slf4j
@Component
@RequiredArgsConstructor
class AdminSeeder implements ApplicationRunner {

	private final UserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final PasswordPolicy passwordPolicy;

	private final StoreProperties store;

	private final Environment environment;

	@Override
	public void run(ApplicationArguments args) {
		if (users.existsByRolesContains(Role.ADMIN)) {
			return;
		}
		if (!StringUtils.hasText(store.adminEmail()) || !StringUtils.hasText(store.adminPassword())) {
			Assert.state(!environment.matchesProfiles("prod"), "There is no admin yet: set ADMIN_EMAIL and ADMIN_PASSWORD");
			log.warn("There is no admin and none is configured");
			return;
		}
		Assert.state(store.adminPassword().length() >= 8 && store.adminPassword().length() <= 100,
				"ADMIN_PASSWORD must have 8 to 100 characters");
		passwordPolicy.requireUncommon(store.adminPassword());
		users.save(User.builder()
			.email(User.normaliseEmail(store.adminEmail()))
			.passwordHash(passwordEncoder.encode(store.adminPassword()))
			.firstName("Store")
			.lastName("Admin")
			.roles(Set.of(Role.ADMIN, Role.MANAGER))
			.mustChangePassword(true)
			.build());
		log.info("Created the first admin");
	}

}
