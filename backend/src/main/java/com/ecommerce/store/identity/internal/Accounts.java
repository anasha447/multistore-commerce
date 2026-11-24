package com.ecommerce.store.identity.internal;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import com.ecommerce.store.platform.ApiError;
import com.ecommerce.store.platform.Role;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/** Register and sign in. Hashing happens between transactions, never inside one. */
@Component
public class Accounts {

	private static final int ALLOWED_FAILURES = 5;

	private static final Duration LOCK = Duration.ofMinutes(15);

	private final UserRepository users;

	private final Passwords passwords;

	private final Sessions sessions;

	private final TransactionTemplate transaction;

	private final Clock clock;

	Accounts(UserRepository users, Passwords passwords, Sessions sessions, TransactionTemplate transaction, Clock clock) {
		this.users = users;
		this.passwords = passwords;
		this.sessions = sessions;
		this.transaction = transaction;
		this.clock = clock;
	}

	public User register(String email, String password, String firstName, String lastName, String phone) {
		return create(email, password, firstName, lastName, phone, Role.CUSTOMER, false,
				"An account with this email already exists. Sign in instead.");
	}

	private User create(String email, String password, String firstName, String lastName, String phone, Role role,
			boolean mustChangePassword, String taken) {
		passwords.requireUncommon(password);
		if (users.emailTaken(User.normalise(email))) {
			throw ApiError.conflict(taken);
		}
		User user = new User(email, passwords.hash(password), firstName, lastName, phone, Set.of(role),
				mustChangePassword, clock.instant());
		try {
			return users.saveAndFlush(user);
		}
		catch (DataIntegrityViolationException ex) {
			if (users.emailTaken(user.getEmail())) {
				throw ApiError.conflict(taken);
			}
			throw ex;
		}
	}

	/** Every way to fail looks the same and takes as long. */
	public Sessions.Pair signIn(String email, String password) {
		Optional<User> found = users.findByEmail(User.normalise(email));
		boolean right = passwords.matches(password, found.map(User::getPasswordHash).orElse(null));
		Instant now = clock.instant();
		return found.flatMap(user -> transaction.execute(status -> {
			if (!right) {
				users.countFailure(user.getId(), ALLOWED_FAILURES, now.plus(LOCK), now);
				return Optional.<Sessions.Pair>empty();
			}
			// also locks the row and refuses an account locked, disabled or given a new password since it was read
			boolean open = users.clearFailures(user.getId(), user.getPasswordHash(), now) == 1;
			return open ? Optional.of(sessions.open(user)) : Optional.<Sessions.Pair>empty();
		})).orElseThrow(() -> ApiError.unauthorized("Invalid email or password."));
	}

}
