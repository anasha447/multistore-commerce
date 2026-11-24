package com.ecommerce.store.platform.startup;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import com.ecommerce.store.StoreApplication;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.mock.env.MockEnvironment;

class ProductionChecksTests {

	private static final String[] NAMES = { "STORE_ID", "STORE_NAME", "STORE_PUBLIC_URL", "DB_URL", "DB_APP_USER",
			"DB_APP_PASSWORD", "DB_OWNER_USER", "DB_OWNER_PASSWORD", "REDIS_HOST", "REDIS_USER", "REDIS_PASSWORD" };

	@Test
	void completeSettingsStart() {
		assertThatCode(() -> check(complete())).doesNotThrowAnyException();
	}

	@Test
	void outsideProductionNothingIsRequired() {
		assertThatCode(() -> check(new MockEnvironment())).doesNotThrowAnyException();
	}

	@ParameterizedTest
	@ValueSource(strings = { "STORE_ID", "STORE_NAME", "STORE_PUBLIC_URL", "DB_URL", "DB_APP_USER", "DB_APP_PASSWORD",
			"DB_OWNER_USER", "DB_OWNER_PASSWORD", "REDIS_HOST", "REDIS_USER", "REDIS_PASSWORD" })
	void aBlankSettingStopsTheApp(String name) {
		refused(complete().withProperty(name, "  "), name + " is missing");
	}

	@Test
	void aShortPasswordStopsTheAppWithoutBeingPrinted() {
		assertThatIllegalStateException().isThrownBy(() -> check(complete().withProperty("REDIS_PASSWORD", "changeme")))
			.withMessageContaining("REDIS_PASSWORD is shorter")
			.satisfies(ex -> assertThatCode(() -> {
				if (ex.getMessage().contains("changeme")) {
					throw new AssertionError("the value was printed");
				}
			}).doesNotThrowAnyException());
	}

	@Test
	void theAppAndTheOwnerAreDifferent() {
		refused(complete().withProperty("DB_OWNER_USER", "value-of-DB_APP_USER"), "DB_APP_USER and DB_OWNER_USER");
		refused(complete().withProperty("DB_OWNER_PASSWORD", "value-of-DB_APP_PASSWORD"),
				"DB_APP_PASSWORD and DB_OWNER_PASSWORD");
	}

	@Test
	void productionIsNotMixedWithDevelopment() {
		MockEnvironment environment = complete();
		environment.addActiveProfile("local");
		refused(environment, "cannot be combined");
	}

	/** The check is really registered: the whole app refuses to start. */
	@Test
	void theAppItselfDoesNotStart() {
		SpringApplication app = new SpringApplicationBuilder(StoreApplication.class).profiles("prod").build();
		assertThatIllegalStateException().isThrownBy(app::run).withMessageStartingWith("Not starting:");
	}

	private static void refused(MockEnvironment environment, String message) {
		assertThatIllegalStateException().isThrownBy(() -> check(environment)).withMessageContaining(message);
	}

	private static void check(MockEnvironment environment) {
		new ProductionChecks().postProcessEnvironment(environment, null);
	}

	private static MockEnvironment complete() {
		MockEnvironment environment = new MockEnvironment();
		environment.setActiveProfiles("prod");
		for (String name : NAMES) {
			environment.setProperty(name, "value-of-" + name);
		}
		return environment;
	}

}
