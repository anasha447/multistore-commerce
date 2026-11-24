package com.ecommerce.store.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Add only: the app's database role cannot change or delete an entry (ADR-0012). */
@Repository
@RequiredArgsConstructor
public class AuditRepository {

	private final JdbcClient jdbc;

	public void add(Long actorId, String actorRoles, String action, String entity, String entityId, String before,
			String after, String clientIp, String requestId) {
		jdbc.sql("""
				insert into audit_entries (actor_id, actor_roles, action, entity, entity_id, before, after, client_ip, request_id)
				values (?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?)""")
			.params(actorId, actorRoles, action, entity, entityId, before, after, clientIp, requestId)
			.update();
	}

	/** One statement for every email, staff or not, so a failed sign-in takes the same time for all. */
	public void addFailedStaffSignIn(String email, String clientIp, String requestId) {
		jdbc.sql("""
				insert into audit_entries (action, entity, entity_id, client_ip, request_id)
				select 'SIGN_IN_FAILED', 'user', u.id, ?, ? from users u
				where lower(u.email) = ? and exists (
					select 1 from user_roles r where r.user_id = u.id and r.role in ('MANAGER', 'ADMIN'))""")
			.params(clientIp, requestId, email)
			.update();
	}

}
