package com.ecommerce.store.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.ecommerce.store.model.Address;

public interface AddressRepository extends JpaRepository<Address, Long> {

	List<Address> findByUserIdOrderByCreatedAt(Long userId);

	Optional<Address> findByIdAndUserId(Long id, Long userId);

	@Modifying
	@Query("update Address a set a.defaultAddress = false where a.userId = :userId and a.defaultAddress and a.id <> :keep")
	void clearDefault(Long userId, Long keep);

}
