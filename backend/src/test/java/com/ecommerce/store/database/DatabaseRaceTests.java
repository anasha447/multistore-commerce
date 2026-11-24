package com.ecommerce.store.database;

import static com.ecommerce.store.Containers.connect;
import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The two statements that keep stock and orders right under load (CHECKOUT-AND-ORDERS.md). */
@IntegrationTest
class DatabaseRaceTests {

	@BeforeEach
	void createTables() throws Exception {
		owner("create table race_stock (id int primary key, quantity int not null check (quantity >= 0))",
				"insert into race_stock values (1, 1)", "create table race_keys (idem_key varchar(80) primary key)",
				"grant select, insert, update on race_stock, race_keys to matessa_app");
	}

	@AfterEach
	void dropTables() throws Exception {
		owner("drop table race_stock", "drop table race_keys");
	}

	@Test
	void fiftyBuyersOfOneUnitLetOneThrough() throws Exception {
		assertThat(together(50, "update race_stock set quantity = quantity - 1 where id = 1 and quantity >= 1"))
			.isEqualTo(1);
	}

	@Test
	void twentyInsertsOfOneKeyLetOneThrough() throws Exception {
		assertThat(together(20, "insert into race_keys values ('same') on conflict do nothing")).isEqualTo(1);
	}

	/** Runs the statement on that many connections at the same moment; answers how many changed a row. */
	private static int together(int threads, String sql) throws Exception {
		CountDownLatch ready = new CountDownLatch(threads);
		CountDownLatch go = new CountDownLatch(1);
		Callable<Integer> attempt = () -> {
			try (Connection app = connect("matessa", "matessa_app"); Statement statement = app.createStatement()) {
				ready.countDown();
				go.await();
				return statement.executeUpdate(sql);
			}
		};
		try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
			List<Future<Integer>> results = new ArrayList<>();
			for (int i = 0; i < threads; i++) {
				results.add(pool.submit(attempt));
			}
			ready.await();
			go.countDown();
			int changed = 0;
			for (Future<Integer> result : results) {
				changed += result.get();
			}
			return changed;
		}
	}

	private static void owner(String... statements) throws Exception {
		try (Connection owner = connect("matessa", "matessa_owner"); Statement statement = owner.createStatement()) {
			for (String sql : statements) {
				statement.execute(sql);
			}
		}
	}

}
