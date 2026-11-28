package com.ecommerce.store;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import jakarta.validation.constraints.Size;
import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommerce.store.security.RateLimiter;

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
			.resideInAnyPackage("com.ecommerce.store.service..", "com.ecommerce.store.dto..", "com.ecommerce.store.security",
					"com.ecommerce.store.config"));
		check(noClasses().that().resideInAPackage("..dto..").should().dependOnClassesThat()
			.resideInAnyPackage("com.ecommerce.store.service..", "com.ecommerce.store.repository", "com.ecommerce.store.security",
					"com.ecommerce.store.config"));
	}

	/** Callers know the interface, never the class behind it. */
	@Test
	void servicesAreAnInterfaceAndItsImplementation() {
		check(classes().that().resideInAPackage("..service.interfaces..").should().beInterfaces());
		check(noClasses().that().resideOutsideOfPackage("..service.impl..").should().dependOnClassesThat()
			.resideInAPackage("..service.impl.."));
		check(classes().that().resideInAPackage("..service.impl..").and().areAnnotatedWith(Service.class).should()
			.haveSimpleNameEndingWith("ServiceImpl").andShould().notBePublic()
			.andShould().implement(resideInAPackage("..service.interfaces..")));
		for (JavaClass service : app) {
			if (service.getPackageName().endsWith("service.interfaces")) {
				assertThat(app.contain("com.ecommerce.store.service.impl." + service.getSimpleName() + "Impl"))
					.as(service.getSimpleName() + " has an implementation of its name").isTrue();
			}
		}
		check(noClasses().that().resideInAPackage("com.ecommerce.store.service").should().beAnnotatedWith(Service.class));
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

	/** Who changes which table. Others may read it; security reads accounts. */
	private static final Map<String, String> OWNERS = Map.of("UserRepository", "UserServiceImpl",
			"RefreshTokenRepository", "RefreshTokenServiceImpl", "AddressRepository", "AddressServiceImpl",
			"AuditRepository", "AuditServiceImpl");

	/** Services work the same in a request and in a job, so they never see the request or the token. */
	@Test
	void servicesSeeNoRequestAndNoToken() {
		check(noClasses().that().resideInAPackage("..service..").should().dependOnClassesThat()
			.resideInAnyPackage("jakarta.servlet..", "org.springframework.web..", "org.springframework.security.core.context..",
					"org.springframework.security.oauth2.."));
	}

	@Test
	void controllersLeaveLimitsToAnnotationsAndServices() {
		check(noClasses().that().resideInAPackage("..controller..").should().dependOnClassesThat().areAssignableTo(RateLimiter.class));
	}

	@Test
	void onlyTheOwnerChangesATable() {
		for (JavaClass repository : app) {
			if (repository.getPackageName().endsWith(".repository") && repository.isTopLevelClass()) {
				assertThat(OWNERS).as(repository.getSimpleName() + " has an owner").containsKey(repository.getSimpleName());
			}
		}
		check(noClasses().should().callMethodWhere(DescribedPredicate.describe("a change of a table it does not own",
				(JavaMethodCall call) -> {
					String owner = OWNERS.get(call.getTargetOwner().getSimpleName());
					return owner != null && !owner.equals(call.getOriginOwner().getSimpleName()) && changes(call);
				})));
	}

	@Test
	void transactionsStartInServices() {
		check(noClasses().that().resideOutsideOfPackage("..service.impl..").should().beAnnotatedWith(Transactional.class));
		check(noMethods().that().areDeclaredInClassesThat().resideOutsideOfPackage("..service.impl..").should()
			.beAnnotatedWith(Transactional.class));
	}

	@Test
	void packagesDependInOneDirection() {
		check(slices().matching("com.ecommerce.store.(*)..").should().beFreeOfCycles());
	}

	/** The error body's timestamp decides nothing; everything else asks the Clock, which tests move. */
	@Test
	void timeComesFromTheClock() {
		check(noClasses().that().doNotHaveSimpleName("GlobalExceptionHandler").and().doNotHaveSimpleName("AppConfig").should()
			.callMethod(Instant.class, "now").orShould().callMethod(LocalDate.class, "now")
			.orShould().callMethod(LocalDateTime.class, "now").orShould().callMethod(System.class, "currentTimeMillis")
			.orShould().callMethod(Clock.class, "systemUTC"));
	}

	@Test
	void everyTextARequestSendsHasAMaximumLength() {
		check(fields().that().areDeclaredInClassesThat().resideInAPackage("..dto.request..").and().haveRawType(String.class)
			.should().beAnnotatedWith(Size.class));
	}

	private static boolean changes(JavaMethodCall call) {
		boolean named = Set.of("save", "saveAndFlush", "saveAll", "delete", "deleteAll", "deleteById", "flush")
			.contains(call.getName()) || call.getName().startsWith("add");
		return named || call.getTarget().resolveMember()
			.map(method -> method.isAnnotatedWith(Modifying.class) || method.isAnnotatedWith(Lock.class))
			.orElse(false);
	}

	private void check(ArchRule rule) {
		rule.check(app);
	}

}
