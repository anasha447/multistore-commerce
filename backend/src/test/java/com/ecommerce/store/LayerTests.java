package com.ecommerce.store;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

/** The layers look in one direction (ADR-0018). */
class LayerTests {

	private final JavaClasses app = new ClassFileImporter().withImportOption(new ImportOption.DoNotIncludeTests())
		.importPackages("com.ecommerce.store");

	@Test
	void controllersUseServicesOnly() {
		check(noClasses().that().resideInAPackage("..controller..").should().dependOnClassesThat()
			.resideInAnyPackage("..repository..", "com.ecommerce.store.model"));
	}

	@Test
	void nothingUsesControllers() {
		check(noClasses().that().resideOutsideOfPackage("..controller..").should().dependOnClassesThat()
			.resideInAPackage("..controller.."));
	}

	@Test
	void dataLooksAtNothingAboveIt() {
		check(noClasses().that().resideInAnyPackage("..model..", "..repository..").should().dependOnClassesThat()
			.resideInAnyPackage("com.ecommerce.store.service", "com.ecommerce.store.dto..", "com.ecommerce.store.security",
					"com.ecommerce.store.config"));
		check(noClasses().that().resideInAPackage("..dto..").should().dependOnClassesThat()
			.resideInAnyPackage("com.ecommerce.store.service", "com.ecommerce.store.repository", "com.ecommerce.store.security",
					"com.ecommerce.store.config"));
	}

	@Test
	void dtosAreRecords() {
		check(classes().that().resideInAPackage("..dto..").should().beRecords());
	}

	@Test
	void classesAreWhereTheirNameSays() {
		check(classes().that().haveSimpleNameEndingWith("Controller").should().resideInAPackage("..controller.."));
		check(classes().that().haveSimpleNameEndingWith("Repository").should().resideInAPackage("..repository.."));
		check(classes().that().areEnums().should().resideInAPackage("..model.enums.."));
	}

	private void check(ArchRule rule) {
		rule.check(app);
	}

}
