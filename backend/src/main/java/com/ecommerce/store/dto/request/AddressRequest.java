package com.ecommerce.store.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.ecommerce.store.model.enums.AddressType;

public record AddressRequest(@NotBlank @Size(max = 255) String line1, @Size(max = 255) String line2,
		@NotBlank @Size(max = 255) String city, @Size(max = 255) String state,
		@NotBlank @Size(max = 50) String postalCode, @NotBlank @Size(max = 255) String country,
		@NotNull AddressType type, boolean isDefault) {
}
