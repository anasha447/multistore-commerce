package com.ecommerce.store.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.ecommerce.store.model.BaseEntity;
import tools.jackson.databind.JsonNode;

/** Compares an answer with the documented response type: every field, in order, with its JSON type. */
public final class Shape {

	private static final Contract CONTRACT = Contract.load();

	private static final Pattern GENERIC = Pattern.compile("(\\w+)<(.+)>");

	private static final Set<String> NEVER_NULL = Set.of("int", "long", "boolean", "double");

	private Shape() {
	}

	public static void assertShape(JsonNode json, String type) {
		check(json, type, type);
	}

	private static void check(JsonNode json, String type, String where) {
		Matcher generic = GENERIC.matcher(type);
		if (generic.matches()) {
			checkGeneric(json, generic.group(1), generic.group(2), where);
			return;
		}
		if (json.isNull()) {
			assertThat(NEVER_NULL).as(where + " is null").doesNotContain(type);
			return;
		}
		switch (type) {
			case "String" -> assertThat(json.isString()).as(where).isTrue();
			case "Long", "long", "Integer", "int" -> assertThat(json.isIntegralNumber()).as(where).isTrue();
			case "Boolean", "boolean" -> assertThat(json.isBoolean()).as(where).isTrue();
			case "Double", "double", "BigDecimal" -> assertThat(json.isNumber()).as(where).isTrue();
			case "Instant" -> assertThat(Instant.parse(json.asString())).as(where).isNotNull();
			default -> checkNamed(json, type, where);
		}
	}

	private static void checkGeneric(JsonNode json, String outer, String inner, String where) {
		switch (outer) {
			case "List", "Set" -> {
				assertThat(json.isArray()).as(where).isTrue();
				json.forEach(item -> check(item, inner, where + "[]"));
			}
			case "Page" -> {
				assertThat(json.propertyNames()).as(where).containsExactly("content", "page");
				check(json.get("content"), "List<" + inner + ">", where);
				assertThat(json.get("page").propertyNames()).containsExactly("size", "number", "totalElements",
						"totalPages");
			}
			case "Map" -> json.forEach(value -> check(value, inner.split(",\\s*", 2)[1], where + "{}"));
			default -> throw new IllegalArgumentException(outer);
		}
	}

	private static void checkNamed(JsonNode json, String type, String where) {
		if (CONTRACT.enums().containsKey(type)) {
			assertThat(CONTRACT.enums().get(type)).as(where).contains(json.asString());
			return;
		}
		List<Contract.Field> fields = CONTRACT.dtos().get(type);
		assertThat(fields).as("no such type: " + type).isNotNull();
		assertThat(json.propertyNames()).as(where)
			.containsExactlyElementsOf(fields.stream().map(Contract.Field::name).toList());
		for (Contract.Field field : fields) {
			JsonNode value = json.get(field.name());
			check(value, field.type(), where + "." + field.name());
			boolean id = field.name().equals("id") || field.name().endsWith("Id");
			if (id && field.type().equals("Long") && !value.isNull()) {
				assertThat(value.asLong()).as(where + "." + field.name()).isBetween(BaseEntity.MIN_ID, BaseEntity.MAX_ID);
			}
		}
	}

}
