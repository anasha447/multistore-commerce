package com.ecommerce.store.identity.internal;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	@Query("select t.userId from RefreshToken t where t.tokenHash = :tokenHash")
	Optional<Long> ownerOf(String tokenHash);

	@Modifying
	@Query("update RefreshToken t set t.revoked = true where t.familyId = :familyId")
	void revokeFamily(String familyId);

	@Modifying
	@Query("update RefreshToken t set t.revoked = true where t.userId = :userId")
	void revokeAll(long userId);

}
