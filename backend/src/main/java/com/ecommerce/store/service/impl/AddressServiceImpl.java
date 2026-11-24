package com.ecommerce.store.service.impl;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecommerce.store.config.CacheNames;
import com.ecommerce.store.dto.request.AddressRequest;
import com.ecommerce.store.dto.response.AddressResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.Address;
import com.ecommerce.store.repository.AddressRepository;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.service.interfaces.AddressService;

@Service
@RequiredArgsConstructor
class AddressServiceImpl implements AddressService {

	private final AddressRepository addresses;

	private final UserRepository users;

	@Override
	@Cacheable(cacheNames = CacheNames.ADDRESSES, key = "#userId", sync = true)
	@Transactional(readOnly = true)
	public List<AddressResponse> all(Long userId) {
		return addresses.findByUserIdOrderByCreatedAt(userId).stream().map(AddressResponse::from).toList();
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ADDRESSES, key = "#userId")
	@Transactional
	public AddressResponse create(Long userId, AddressRequest request) {
		Address address = new Address();
		address.setUserId(userId);
		return save(address, request);
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ADDRESSES, key = "#userId")
	@Transactional
	public AddressResponse update(Long userId, Long id, AddressRequest request) {
		return save(find(userId, id), request);
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ADDRESSES, key = "#userId")
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
