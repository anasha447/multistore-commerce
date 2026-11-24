package com.ecommerce.store.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/** What the frozen storefront calls and reads is part of the contract. */
class StorefrontContractTests {

	private static final Path STOREFRONT = Contract.ROOT.resolve("frontend");

	private static final Pattern CALL = Pattern.compile("['\"`}](/api/[^'\"`\\s]+)['\"`]");

	private static final Pattern INTERFACE = Pattern.compile("export interface (\\w+)[^{]*\\{([^}]*)}");

	private static final Pattern PROPERTY = Pattern.compile("(?m)^\\s*(\\w+)\\??:");

	/** Declared by the storefront but read by no screen, and never sent. */
	private static final Map<String, Set<String>> UNUSED = Map.of("OrderStatusHistoryResponse", Set.of("orderId"));

	private final Contract contract = Contract.load();

	@Test
	void everyPathTheStorefrontCallsIsInTheContract() throws IOException {
		Set<String> known = contract.endpoints().stream().map(Contract.Endpoint::shape).collect(Collectors.toSet());
		Set<String> called = new TreeSet<>();
		for (Path file : sources("app", "lib", "components")) {
			// the allow-list holds path prefixes, not calls
			if (file.endsWith("server/guard.ts")) {
				continue;
			}
			Matcher matcher = CALL.matcher(Files.readString(file));
			while (matcher.find()) {
				String path = normalise(matcher.group(1));
				if (!path.startsWith("/api/bff") && !path.startsWith("/api/session")) {
					called.add(path);
				}
			}
		}
		assertThat(called).hasSizeGreaterThan(40);
		assertThat(called).isSubsetOf(known);
	}

	@Test
	void everyFieldTheStorefrontDeclaresIsInTheContract() throws IOException {
		Map<String, Set<String>> missing = new TreeMap<>();
		int compared = 0;
		for (Path file : sources("lib/types")) {
			Matcher matcher = INTERFACE.matcher(plain(Files.readString(file)));
			while (matcher.find()) {
				List<Contract.Field> fields = contract.dtos().get(matcher.group(1));
				if (fields == null) {
					continue;
				}
				compared++;
				Set<String> declared = new TreeSet<>();
				Matcher property = PROPERTY.matcher(matcher.group(2));
				while (property.find()) {
					declared.add(property.group(1));
				}
				fields.forEach(field -> declared.remove(field.name()));
				declared.removeAll(UNUSED.getOrDefault(matcher.group(1), Set.of()));
				if (!declared.isEmpty()) {
					missing.put(matcher.group(1), declared);
				}
			}
		}
		assertThat(compared).isGreaterThan(30);
		assertThat(missing).isEmpty();
	}

	private static String normalise(String path) {
		String shape = path.replaceAll("\\$\\{[^}]*}", "{}").replaceFirst("\\?.*$", "");
		// a query string appended as a variable is not a path segment
		return shape.replaceFirst("(?<!/)\\{}$", "");
	}

	/** Comments removed and nested object types flattened to their property name. */
	private static String plain(String source) {
		return source.replaceAll("(?s)/\\*.*?\\*/", "")
			.replaceAll("//[^\\n]*", "")
			.replaceAll(":[^:;{}\\n]*\\{[^{}]*}", ": object");
	}

	private static List<Path> sources(String... directories) throws IOException {
		List<Path> files = new ArrayList<>();
		for (String directory : directories) {
			try (Stream<Path> walk = Files.walk(STOREFRONT.resolve(directory))) {
				walk.filter(file -> file.toString().matches(".*\\.tsx?")).forEach(files::add);
			}
		}
		return files;
	}

}
