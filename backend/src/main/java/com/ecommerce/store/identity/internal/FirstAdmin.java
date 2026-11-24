package com.ecommerce.store.identity.internal;

import java.time.Clock;
import java.util.List;

import com.ecommerce.store.platform.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Creates the first admin from the settings while there is none. Never changes an existing account. */
@Component
class FirstAdmin implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(FirstAdmin.class);

	private final UserRepository users;

	private final Passwords passwords;

	private final Clock clock;

	private final String email;

	private final String password;

	private final boolean production;

	FirstAdmin(UserRepository users, Passwords passwords, Clock clock, Environment environment,
			@Value("${ADMIN_EMAIL:}") String email, @Value("${ADMIN_PASSWORD:}") String password) {
		this.users = users;
		this.passwords = passwords;
		this.clock = clock;
		this.email = email;
		this.password = password;
		this.production = environment.acceptsProfiles(Profiles.of("prod"));
	}

	@Override
	public void run(ApplicationArguments args) {
		if (users.anyWithRole(Role.ADMIN)) {
			return;
		}
		if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
			if (production) {
				throw new IllegalStateException("There is no admin yet: set ADMIN_EMAIL and ADMIN_PASSWORD");
			}
			log.warn("There is no admin and none is configured");
			return;
		}
		if (password.length() < 8 || password.length() > 100) {
			throw new IllegalStateException("ADMIN_PASSWORD must have 8 to 100 characters");
		}
		passwords.requireUncommon(password);
		if (users.emailTaken(User.normalise(email))) {
			throw new IllegalStateException("ADMIN_EMAIL belongs to an account that is not an admin");
		}
		try {
			users.saveAndFlush(new User(email, passwords.hash(password), "Store", "Admin", null,
					List.of(Role.ADMIN, Role.MANAGER), true, clock.instant()));
			log.info("Created the first admin");
		}
		catch (DataIntegrityViolationException ex) {
			log.info("Another copy of the app created the first admin");
		}
	}

}
