package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;

class ProductionCheckTests {

	@Test
	void completeSettingsStart() {
		assertThatCode(() -> new ProductionCheck(complete())).doesNotThrowAnyException();
	}

	@ParameterizedTest
	@ValueSource(strings = { "DB_APP_PASSWORD", "DB_OWNER_PASSWORD", "REDIS_PASSWORD" })
	void blankAndShortPasswordsStopTheAppWithoutBeingPrinted(String name) {
		for (String value : new String[] { "", "				  ", "changeme" }) {
			assertThatIllegalStateException().isThrownBy(() -> new ProductionCheck(complete().withProperty(name, value)))
				.withMessage(name + " needs 16 characters or more");
		}
	}

	@Test
	void theAppIsNotTheOwner() {
		assertThatIllegalStateException()
			.isThrownBy(() -> new ProductionCheck(complete().withProperty("DB_OWNER_USER", "app")))
			.withMessageContaining("must differ");
	}

	@Test
	void productionIsNotMixedWithDevelopment() {
		MockEnvironment environment = complete();
		environment.addActiveProfile("local");
		assertThatIllegalStateException().isThrownBy(() -> new ProductionCheck(environment))
			.withMessageContaining("cannot be combined");
	}

	@Test
	void itIsActiveInProductionOnly() {
		ApplicationContextRunner runner = new ApplicationContextRunner().withUserConfiguration(ProductionCheck.class);
		runner.run(context -> org.assertj.core.api.Assertions.assertThat(context).hasNotFailed());
		runner.withPropertyValues("spring.profiles.active=prod")
			.run(context -> org.assertj.core.api.Assertions.assertThat(context).hasFailed());
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "Matessa", "a", "x; drop", "../adventure" })
	void aBadStoreIdStopsTheApp(String id) {
		new ApplicationContextRunner().withUserConfiguration(Settings.class)
			.withPropertyValues("store.id=" + id)
			.run(context -> org.assertj.core.api.Assertions.assertThat(context).hasFailed());
	}

	@EnableConfigurationProperties(StoreProperties.class)
	static class Settings {

	}

	private static MockEnvironment complete() {
		MockEnvironment environment = new MockEnvironment();
		environment.setActiveProfiles("prod");
		return environment.withProperty("DB_APP_USER", "app")
			.withProperty("DB_OWNER_USER", "owner")
			.withProperty("DB_APP_PASSWORD", "x".repeat(16))
			.withProperty("DB_OWNER_PASSWORD", "y".repeat(16))
			.withProperty("REDIS_PASSWORD", "z".repeat(16));
	}

}
