package com.ecommerce.store.service.interfaces;

import java.util.List;

import com.ecommerce.store.dto.request.AddressRequest;
import com.ecommerce.store.dto.response.AddressResponse;

/** An address of someone else does not exist for the caller. */
public interface AddressService {

	/** In the order they were added. */
	List<AddressResponse> all(Long userId);

	AddressResponse create(Long userId, AddressRequest request);

	AddressResponse update(Long userId, Long id, AddressRequest request);

	void delete(Long userId, Long id);

}
