package com.ecommerce.store.dto.response;

import com.ecommerce.store.model.Address;
import com.ecommerce.store.model.enums.AddressType;

public record AddressResponse(Long id, String line1, String line2, String city, String state, String postalCode,
		String country, AddressType type, boolean isDefault) {

	public static AddressResponse from(Address address) {
		return new AddressResponse(address.getId(), address.getLine1(), address.getLine2(), address.getCity(),
				address.getState(), address.getPostalCode(), address.getCountry(), address.getType(),
				address.isDefaultAddress());
	}

}
