package com.ecommerce.store.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

/** What every cached read must keep to, so that nobody forgets to clear one. */
class CacheRulesTests {

	/** Caches whose clearing is proven in NoDatabaseOnGetTests. A new one fails until it is added with its test. */
	private static final Set<String> PROVEN = Set.of(CacheNames.ME, CacheNames.ADDRESSES);

	private final List<Method> methods = new ClassFileImporter().importPackages("com.ecommerce.store.service.impl")
		.stream()
		.flatMap(type -> Arrays.stream(type.reflect().getDeclaredMethods()))
		.toList();

	@Test
	void everyCacheHasAProvenClearing() throws Exception {
		Set<String> names = new TreeSet<>();
		for (Field name : CacheNames.class.getFields()) {
			names.add((String) name.get(null));
		}
		Set<String> read = new TreeSet<>();
		Set<String> cleared = new TreeSet<>();
		for (Method method : methods) {
			Optional.ofNullable(method.getAnnotation(Cacheable.class)).ifPresent(a -> read.addAll(List.of(a.cacheNames())));
			for (CacheEvict evict : method.getAnnotationsByType(CacheEvict.class)) {
				cleared.addAll(List.of(evict.cacheNames()));
			}
		}
		assertThat(read).as("cached").isEqualTo(names);
		assertThat(cleared).as("cleared").isEqualTo(names);
		assertThat(new TreeSet<>(PROVEN)).as("proven").isEqualTo(names);
	}

	/** Only synchronised reads load once, survive Redis and respect a failed clear. */
	@Test
	void cachedReadsAreSynchronised() {
		assertThat(methods).filteredOn(method -> method.isAnnotationPresent(Cacheable.class))
			.isNotEmpty()
			.allSatisfy(method -> assertThat(method.getAnnotation(Cacheable.class).sync()).as(method.toString()).isTrue());
	}

}
