package com.ecommerce.store.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

/** The two contract documents are complete and agree with each other. */
class ContractDocumentTests {

	private static final Set<String> PLAIN_TYPES = Set.of("String", "Long", "long", "Integer", "int", "Boolean",
			"boolean", "Double", "double", "BigDecimal", "Instant", "List", "Set", "Map", "Page", "ResponseEntity",
			"byte", "void", "Valid");

	private static final Pattern WORD = Pattern.compile("[A-Za-z]+");

	private final Contract contract = Contract.load();

	@Test
	void everyEndpointIsListedOnce() {
		assertThat(contract.endpoints()).hasSize(91).extracting(Contract.Endpoint::key).doesNotHaveDuplicates();
	}

	@Test
	void modulesHaveTheDocumentedNumberOfEndpoints() {
		Map<String, Long> perModule = contract.endpoints()
			.stream()
			.collect(Collectors.groupingBy(Contract.Endpoint::module, Collectors.counting()));
		assertThat(perModule).isEqualTo(Map.of("identity", 15L, "catalog", 23L, "media", 1L, "promotions", 11L,
				"engagement", 13L, "cart", 6L, "orders", 12L, "analytics", 10L));
	}

	@Test
	void bothDocumentsDescribeTheSameEndpoints() {
		Map<String, Contract.Endpoint> listed = contract.endpoints()
			.stream()
			.collect(Collectors.toMap(Contract.Endpoint::key, Function.identity()));
		assertThat(contract.signatures().keySet()).isEqualTo(listed.keySet());
		contract.signatures().forEach((key, signature) -> {
			assertThat(listed.get(key).returns()).as("returns of %s", key).isEqualTo(signature.returns());
			assertThat(listed.get(key).status()).as("status of %s", key).isEqualTo(signature.status());
		});
	}

	@Test
	void accessUsesOnlyDefinedWords() {
		assertThat(contract.endpoints()).extracting(Contract.Endpoint::access)
			.isSubsetOf("public", "customer", "self", "owner", "owner or staff", "staff", "admin");
	}

	@Test
	void everyTypeIsDefined() {
		Set<String> unknown = new TreeSet<>();
		contract.dtos().values().forEach(fields -> fields.forEach(field -> collectUnknown(field.type(), unknown)));
		contract.endpoints().forEach(endpoint -> collectUnknown(endpoint.returns(), unknown));
		assertThat(unknown).isEmpty();
	}

	private void collectUnknown(String type, Set<String> unknown) {
		Matcher words = WORD.matcher(type);
		while (words.find()) {
			String word = words.group();
			if (!PLAIN_TYPES.contains(word) && !contract.dtos().containsKey(word)
					&& !contract.enums().containsKey(word)) {
				unknown.add(word);
			}
		}
	}

}
