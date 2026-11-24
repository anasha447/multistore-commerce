package com.ecommerce.store.identity.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.platform.PublicId;
import com.ecommerce.store.platform.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.transaction.support.TransactionTemplate;

@IntegrationTest
class UserTests {

	private static final Instant NOW = Instant.parse("2026-11-24T10:00:00Z");

	@Autowired
	private UserRepository users;

	@Autowired
	private Passwords passwords;

	@Autowired
	private Clock clock;

	@Autowired
	private TransactionTemplate transaction;

	@Test
	void isStoredWithARandomIdAndItsRoles() {
		User saved = users.save(user(unique(), Role.ADMIN, Role.MANAGER));
		User loaded = users.findByEmail(saved.getEmail()).orElseThrow();
		assertThat(loaded.getId()).isBetween(PublicId.MIN, PublicId.MAX);
		assertThat(loaded.getRoles()).containsExactlyInAnyOrder(Role.ADMIN, Role.MANAGER);
		assertThat(loaded.getCreatedAt()).isEqualTo(NOW);
	}

	@Test
	void emailsAreTrimmedLowerCasedAndUnique() {
		String email = unique();
		users.save(user("  " + email.toUpperCase() + " ", Role.CUSTOMER));
		assertThat(users.findByEmail(email)).isPresent();
		assertThat(users.emailTaken(email)).isTrue();
		assertThatExceptionOfType(DataIntegrityViolationException.class)
			.isThrownBy(() -> users.saveAndFlush(user(email, Role.CUSTOMER)));
	}

	@Test
	void theFifthFailureLocksAndTheCounterStartsAgain() {
		long id = users.save(user(unique(), Role.CUSTOMER)).getId();
		for (int i = 1; i <= 4; i++) {
			fail(id, NOW);
			assertThat(load(id).getFailedLogins()).isEqualTo(i);
			assertThat(load(id).isLocked(NOW)).isFalse();
		}
		fail(id, NOW);
		assertThat(load(id).getFailedLogins()).isZero();
		assertThat(load(id).isLocked(NOW.plusSeconds(899))).isTrue();
		assertThat(load(id).isLocked(NOW.plusSeconds(900))).isFalse();
	}

	@Test
	void attemptsWhileLockedChangeNothing() {
		long id = users.save(user(unique(), Role.CUSTOMER)).getId();
		for (int i = 0; i < 5; i++) {
			fail(id, NOW);
		}
		Instant until = load(id).getLockedUntil();
		assertThat(fail(id, NOW.plusSeconds(600))).isZero();
		assertThat(clear(id, NOW.plusSeconds(600))).isZero();
		assertThat(load(id).getLockedUntil()).isEqualTo(until);
		assertThat(clear(id, NOW.plusSeconds(901))).isEqualTo(1);
		assertThat(load(id).getLockedUntil()).isNull();
	}

	@Test
	void theFirstAdminMustChangeThePasswordAndIsCreatedOnce() {
		transaction.executeWithoutResult(status -> {
			status.setRollbackOnly();
			users.findAll().stream().filter(user -> user.getRoles().contains(Role.ADMIN)).forEach(user -> user.getRoles().remove(Role.ADMIN));
			users.flush();
			String email = unique();
			admin(email, "masala-mate-2026!").run(null);
			User admin = users.findByEmail(email).orElseThrow();
			assertThat(admin.getRoles()).containsExactlyInAnyOrder(Role.ADMIN, Role.MANAGER);
			assertThat(admin.isMustChangePassword()).isTrue();

			String second = unique();
			admin(second, "masala-mate-2026!").run(null);
			assertThat(users.findByEmail(second)).isEmpty();
		});
	}

	@Test
	void productionNeedsAnAdmin() {
		transaction.executeWithoutResult(status -> {
			status.setRollbackOnly();
			users.findAll().forEach(user -> user.getRoles().remove(Role.ADMIN));
			users.flush();
			assertThatIllegalStateException().isThrownBy(() -> admin("", "").run(null))
				.withMessageContaining("ADMIN_EMAIL");
		});
	}

	private FirstAdmin admin(String email, String password) {
		MockEnvironment production = new MockEnvironment();
		production.setActiveProfiles("prod");
		return new FirstAdmin(users, passwords, clock, production, email, password);
	}

	private int fail(long id, Instant now) {
		return transaction
			.execute(status -> users.countFailure(id, 5, now.plus(Duration.ofMinutes(15)), now));
	}

	private int clear(long id, Instant now) {
		return transaction.execute(status -> users.clearFailures(id, now));
	}

	private User load(long id) {
		return users.findWithRoles(id).orElseThrow();
	}

	private static User user(String email, Role... roles) {
		return new User(email, "hash", "Asha", "Rao", null, List.of(roles), false, NOW);
	}

	private static String unique() {
		return "user-" + UUID.randomUUID() + "@example.com";
	}

}
