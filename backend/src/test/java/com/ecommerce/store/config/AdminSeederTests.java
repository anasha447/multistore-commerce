package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.util.HashSet;
import java.util.UUID;

import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.PasswordPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class AdminSeederTests {

	@Autowired
	private UserRepository users;

	@Autowired
	private PasswordEncoder encoder;

	@Autowired
	private PasswordPolicy policy;

	@Autowired
	private JdbcClient jdbc;

	@Test
	void theFirstAdminMustChangeThePasswordAndIsCreatedOnce() {
		jdbc.sql("delete from user_roles where role = 'ADMIN'").update();
		String email = People.email();
		seeder(email, UUID.randomUUID().toString()).run(null);
		users.flush();
		User admin = users.findByEmail(email).orElseThrow();
		assertThat(new HashSet<>(admin.getRoles())).containsExactlyInAnyOrder(Role.ADMIN, Role.MANAGER);
		assertThat(admin.isMustChangePassword()).isTrue();
		assertThat(admin.isEnabled()).isTrue();

		String second = People.email();
		seeder(second, UUID.randomUUID().toString()).run(null);
		users.flush();
		assertThat(users.existsByEmail(second)).isFalse();
	}

	@Test
	void productionNeedsAnAdmin() {
		jdbc.sql("delete from user_roles where role = 'ADMIN'").update();
		assertThatIllegalStateException().isThrownBy(() -> seeder("", "").run(null)).withMessageContaining("ADMIN_EMAIL");
	}

	private AdminSeeder seeder(String email, String password) {
		MockEnvironment production = new MockEnvironment();
		production.setActiveProfiles("prod");
		return new AdminSeeder(users, encoder, policy, new StoreProperties("matessa", email, password), production);
	}

}
