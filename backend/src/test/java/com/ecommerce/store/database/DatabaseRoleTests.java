package com.ecommerce.store.database;

import static com.ecommerce.store.Containers.connect;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/** What each database role may do (DATA-MODEL.md, "Database roles per store"). */
@IntegrationTest
class DatabaseRoleTests {

	private static final String DENIED = "42501";

	private static final Set<String> APPEND_ONLY = Set.of("audit_entries", "stock_movements", "order_status_history");

	private static final Set<String> OWNER_ONLY = Set.of("flyway_schema_history");

	@Autowired
	private JdbcClient jdbc;

	@Test
	void theAppRunsAsTheAppRole() {
		assertThat(jdbc.sql("select current_user").query(String.class).single()).isEqualTo("matessa_app");
		assertThat(jdbc.sql("show statement_timeout").query(String.class).single()).isEqualTo("15s");
		assertThat(jdbc.sql("show idle_in_transaction_session_timeout").query(String.class).single()).isEqualTo("30s");
	}

	@ParameterizedTest
	@ValueSource(strings = { "update audit_entries set action = 'x'", "delete from audit_entries",
			"truncate audit_entries", "drop table audit_entries", "create table shop.sneaky (id int)",
			"create table public.sneaky (id int)", "select * from flyway_schema_history",
			"alter table audit_entries disable trigger all", "create role sneaky", "set role matessa_owner" })
	void theAppIsRefused(String sql) throws SQLException {
		try (Connection app = connect("matessa", "matessa_app")) {
			refused(app, sql);
		}
	}

	/** Postgres only warns about a grant without authority, so the effect is what counts. */
	@Test
	void theAppCannotGiveItselfRights() throws SQLException {
		try (Connection app = connect("matessa", "matessa_app")) {
			app.createStatement().execute("grant update, delete on audit_entries to matessa_app");
			refused(app, "update audit_entries set action = 'x'");
		}
	}

	@Test
	void theAppCanAddAndReadAuditEntries() {
		jdbc.sql("insert into audit_entries (action, entity) values ('TEST', 'role-test')").update();
		assertThat(jdbc.sql("select count(*) from audit_entries where entity = 'role-test'").query(Long.class).single())
			.isPositive();
	}

	/** A new table without grants, or an append-only one with too many, fails here. */
	@Test
	void theAppHasExactlyTheRightsEachTableNeeds() {
		Map<String, Set<String>> rights = new TreeMap<>();
		jdbc.sql("select tablename from pg_tables where schemaname = 'shop'")
			.query(String.class)
			.list()
			.forEach(table -> rights.put(table, new TreeSet<>()));
		jdbc.sql("""
				select table_name, privilege_type from information_schema.role_table_grants
				where table_schema = 'shop' and grantee = 'matessa_app'""").query((rs, row) -> {
			if (rights.containsKey(rs.getString(1))) {
				rights.get(rs.getString(1)).add(rs.getString(2));
			}
			return null;
		}).list();
		assertThat(rights).isNotEmpty().allSatisfy((table, granted) -> {
			if (OWNER_ONLY.contains(table)) {
				assertThat(granted).as(table).isEmpty();
			}
			else if (APPEND_ONLY.contains(table)) {
				assertThat(granted).as(table).containsExactlyInAnyOrder("SELECT", "INSERT");
			}
			else {
				assertThat(granted).as(table).containsExactlyInAnyOrder("SELECT", "INSERT", "UPDATE", "DELETE");
			}
		});
	}

	@ParameterizedTest
	@CsvSource({ "adventure,matessa_app", "adventure,matessa_owner", "adventure,matessa_backup",
			"matessa,adventure_app", "matessa,adventure_owner", "matessa,adventure_backup", "postgres,matessa_app",
			"template1,matessa_owner" })
	void noRoleReachesAnotherDatabase(String database, String role) {
		assertThatThrownBy(() -> connect(database, role).close()).isInstanceOfSatisfying(SQLException.class,
				ex -> assertThat(ex.getSQLState()).isEqualTo(DENIED));
	}

	@Test
	void theBackupRoleReadsEverythingAndWritesNothing() throws SQLException {
		List<String> tables = jdbc.sql("select tablename from pg_tables where schemaname = 'shop'")
			.query(String.class)
			.list();
		try (Connection backup = connect("matessa", "matessa_backup")) {
			JdbcClient client = JdbcClient.create(new SingleConnectionDataSource(backup, true));
			for (String table : tables) {
				client.sql("select count(*) from " + table).query(Long.class).single();
			}
			refused(backup, "insert into audit_entries (action, entity) values ('x', 'x')");
			refused(backup, "delete from shedlock");
			refused(backup, "create table sneaky (id int)");
		}
	}

	@Test
	void noStoreRoleHasSpecialRights() {
		assertThat(jdbc.sql("""
				select rolname from pg_roles
				where (rolname like 'matessa%' or rolname like 'adventure%')
				and (rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls)""")
			.query(String.class)
			.list()).isEmpty();
	}

	private static void refused(Connection connection, String sql) {
		assertThatThrownBy(() -> connection.createStatement().execute(sql)).as(sql)
			.isInstanceOfSatisfying(SQLException.class, ex -> assertThat(ex.getSQLState()).isEqualTo(DENIED));
	}

}
