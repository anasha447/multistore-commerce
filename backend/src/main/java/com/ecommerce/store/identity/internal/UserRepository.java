package com.ecommerce.store.identity.internal;

import java.time.Instant;
import java.util.Optional;

import com.ecommerce.store.platform.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface UserRepository extends JpaRepository<User, Long> {

	/** The email must be normalised. */
	@Query("select u from User u left join fetch u.roles where lower(u.email) = :email")
	Optional<User> findByEmail(String email);

	@Query("select u from User u left join fetch u.roles where u.id = :id")
	Optional<User> findWithRoles(long id);

	@Query("select count(u) > 0 from User u where lower(u.email) = :email")
	boolean emailTaken(String email);

	@Query("select count(u) > 0 from User u join u.roles r where r = :role")
	boolean anyWithRole(Role role);

	/** Counts a wrong password. The last allowed one locks and starts counting again; a locked account is left alone. */
	@Modifying
	@Query(nativeQuery = true, value = """
			update users
			   set failed_logins = case when failed_logins + 1 >= :allowed then 0 else failed_logins + 1 end,
			       locked_until = case when failed_logins + 1 >= :allowed then cast(:lockUntil as timestamptz) end
			 where id = :id and (locked_until is null or locked_until <= :now)""")
	int countFailure(long id, int allowed, Instant lockUntil, Instant now);

	/** Nothing is changed when the account was locked or disabled while the password was being checked. */
	@Modifying
	@Query(nativeQuery = true, value = """
			update users set failed_logins = 0, locked_until = null
			 where id = :id and enabled and (locked_until is null or locked_until <= :now)""")
	int clearFailures(long id, Instant now);

}
