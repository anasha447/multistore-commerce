package com.ecommerce.store.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;

public interface UserRepository extends JpaRepository<User, Long> {

	/** The email must be normalised. */
	@EntityGraph(attributePaths = "roles")
	@Query("select u from User u where lower(u.email) = :email")
	Optional<User> findByEmail(String email);

	@Query("select count(u) > 0 from User u where lower(u.email) = :email")
	boolean existsByEmail(String email);

	boolean existsByRolesContains(Role role);

	/** Both filters are optional; an account with several roles appears once. */
	@Query("""
			select u from User u
			where (:role is null or exists (select 1 from User x join x.roles r where x = u and r = :role))
			and (:enabled is null or u.enabled = :enabled)""")
	Page<User> search(Role role, Boolean enabled, Pageable pageable);

	boolean existsByIdAndEnabledTrue(Long id);

	@Query("select u.id from User u where u.enabled = false and u.updatedAt > :since")
	List<Long> findDisabledSince(Instant since);

	/** Everything that ends or continues sign-ins starts with this. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select u from User u where u.id = :id")
	Optional<User> findAndLock(Long id);

	/** Counts a wrong password. The last allowed one locks and starts counting again; a locked account is left alone. */
	@Modifying
	@Query(nativeQuery = true, value = """
			update users
			   set failed_logins = case when failed_logins + 1 >= :allowed then 0 else failed_logins + 1 end,
				   locked_until = case when failed_logins + 1 >= :allowed then cast(:lockUntil as timestamptz) end
			 where lower(email) = :email and (locked_until is null or locked_until <= :now)""")
	int countFailure(String email, int allowed, Instant lockUntil, Instant now);

	/** Changes nothing when the account was locked, disabled or given a new password while the old one was checked. */
	@Modifying
	@Query(nativeQuery = true, value = """
			update users set failed_logins = 0, locked_until = null
			 where id = :id and enabled and password_hash = :hash and (locked_until is null or locked_until <= :now)""")
	int clearFailures(Long id, String hash, Instant now);

}
