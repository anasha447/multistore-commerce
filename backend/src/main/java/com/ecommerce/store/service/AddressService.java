package com.ecommerce.store.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.store.dto.request.AddressRequest;
import com.ecommerce.store.dto.response.AddressResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.Address;
import com.ecommerce.store.repository.AddressRepository;
import com.ecommerce.store.repository.UserRepository;

/** An address of someone else does not exist for the caller. */
@Service
@RequiredArgsConstructor
public class AddressService {

	private final AddressRepository addresses;

	private final UserRepository users;

	@Transactional(readOnly = true)
	public Page<AddressResponse> list(Long userId, Pageable pageable) {
		return addresses.findByUserId(userId, Paging.sorted(pageable, Sort.by("createdAt"), "createdAt"))
			.map(AddressResponse::from);
	}

	@Transactional
	public AddressResponse create(Long userId, AddressRequest request) {
		Address address = new Address();
		address.setUserId(userId);
		return save(address, request);
	}

	@Transactional
	public AddressResponse update(Long userId, Long id, AddressRequest request) {
		return save(find(userId, id), request);
	}

	@Transactional
	public void delete(Long userId, Long id) {
		addresses.delete(find(userId, id));
	}

	/** The account's row is locked, so two requests cannot both set a default. */
	private AddressResponse save(Address address, AddressRequest request) {
		if (request.isDefault()) {
			users.findAndLock(address.getUserId());
			// 0 is nobody's id
			addresses.clearDefault(address.getUserId(), (address.getId() != null) ? address.getId() : 0);
		}
		address.setLine1(request.line1());
		address.setLine2(request.line2());
		address.setCity(request.city());
		address.setState(request.state());
		address.setPostalCode(request.postalCode());
		address.setCountry(request.country());
		address.setType(request.type());
		address.setDefaultAddress(request.isDefault());
		return AddressResponse.from(addresses.save(address));
	}

	private Address find(Long userId, Long id) {
		return addresses.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Address not found."));
	}

}
