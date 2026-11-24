package com.ecommerce.store.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

/** Enums and DTO records in the code are the documented ones, field by field and in order. */
class CodeContractTests {

	private final Contract contract = Contract.load();

	@Test
	void enumsHaveTheDocumentedValues() throws Exception {
		for (Map.Entry<String, List<String>> documented : contract.enums().entrySet()) {
			Class<?> type = Class.forName("com.ecommerce.store.model.enums." + documented.getKey());
			assertThat(Arrays.stream(type.getEnumConstants()).map(Object::toString)).as(documented.getKey())
				.containsExactlyElementsOf(documented.getValue());
		}
	}

	@Test
	void recordsHaveTheDocumentedFields() {
		int compared = 0;
		for (JavaClass type : new ClassFileImporter().importPackages("com.ecommerce.store.dto")) {
			List<Contract.Field> fields = contract.dtos().get(type.getSimpleName());
			if (fields != null) {
				assertThat(Arrays.stream(type.reflect().getRecordComponents()).map(RecordComponent::getName))
					.as(type.getSimpleName())
					.containsExactlyElementsOf(fields.stream().map(Contract.Field::name).toList());
				compared++;
			}
		}
		assertThat(compared).isPositive();
	}

}
