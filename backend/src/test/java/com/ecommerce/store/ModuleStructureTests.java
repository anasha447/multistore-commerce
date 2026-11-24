package com.ecommerce.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModule;
import org.springframework.modulith.core.ApplicationModules;

/** The walls between modules. Fails on a forbidden dependency, a cycle or an undeclared module. */
class ModuleStructureTests {

	private final ApplicationModules modules = ApplicationModules.of(StoreApplication.class);

	@Test
	void modulesKeepTheirWalls() {
		modules.verify();
	}

	@Test
	void everyDocumentedModuleExists() {
		assertThat(modules.stream().map(ApplicationModule::getBasePackage).map(base -> base.getName()))
			.extracting(name -> name.substring(name.lastIndexOf('.') + 1))
			.containsExactlyInAnyOrder("platform", "identity", "catalog", "inventory", "promotions", "pricing", "media",
					"cart", "payments", "orders", "engagement", "analytics", "notifications", "audit");
	}

}
