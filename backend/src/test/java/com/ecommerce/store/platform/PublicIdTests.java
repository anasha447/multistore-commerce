package com.ecommerce.store.platform;

import static com.ecommerce.store.Containers.connect;
import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.util.List;
import java.util.stream.LongStream;

import com.ecommerce.fixtures.SampleThing;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

class PublicIdTests {

	@Test
	void hasSixteenDigitsAndFitsJavaScript() {
		assertThat(PublicId.MAX).isEqualTo((1L << 53) - 1);
		assertThat(ids(100_000)).allSatisfy(id -> {
			assertThat(id).isBetween(PublicId.MIN, PublicId.MAX);
			assertThat(Long.toString(id)).hasSize(16);
		});
	}

	@Test
	void isNotCountableAndDoesNotRepeat() {
		List<Long> ids = ids(100_000);
		assertThat(ids).doesNotHaveDuplicates();
		long neighbours = LongStream.range(1, ids.size())
			.filter(i -> Math.abs(ids.get((int) i) - ids.get((int) i - 1)) < 1_000)
			.count();
		assertThat(neighbours).isZero();
	}

	@Test
	void usesTheWholeRange() {
		long middle = (PublicId.MIN + PublicId.MAX) / 2;
		assertThat(ids(10_000).stream().filter(id -> id > middle).count()).isBetween(4_700L, 5_300L);
	}

	@Test
	void entityGetsItsIdWhenSavedAndKeepsIt() throws Exception {
		try (Connection owner = connect("matessa", "matessa_owner")) {
			owner.createStatement().execute("""
					create temp table sample_things (
					    id bigint primary key check (id between 1000000000000000 and 9007199254740991),
					    name varchar(50) not null)""");
			try (EntityManagerFactory factory = new PersistenceConfiguration("sample").managedClass(SampleThing.class)
				.property("hibernate.connection.datasource", new SingleConnectionDataSource(owner, true))
				.property("hibernate.hbm2ddl.auto", "none")
				.createEntityManagerFactory()) {
				SampleThing first = new SampleThing("first");
				SampleThing second = new SampleThing("second");
				assertThat(first.getId()).isNull();
				assertThat(first).isNotEqualTo(second);

				factory.runInTransaction(em -> {
					em.persist(first);
					assertThat(first.getId()).as("before the insert").isBetween(PublicId.MIN, PublicId.MAX);
					em.persist(second);
				});

				assertThat(Math.abs(first.getId() - second.getId())).isGreaterThan(1_000);
				factory.runInTransaction(em -> {
					SampleThing proxy = em.getReference(SampleThing.class, first.getId());
					assertThat(proxy.equals(first)).as("lazy proxy").isTrue();
					assertThat(first.equals(proxy)).isTrue();
					assertThat(proxy).hasSameHashCodeAs(first);
				});
				factory.runInTransaction(em -> {
					SampleThing loaded = em.find(SampleThing.class, first.getId());
					assertThat(loaded.getName()).isEqualTo("first");
					assertThat(loaded).isEqualTo(first).hasSameHashCodeAs(first).isNotEqualTo(second);
				});
			}
		}
	}

	private static List<Long> ids(int count) {
		return LongStream.generate(PublicId::next).limit(count).boxed().toList();
	}

}
