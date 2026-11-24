package com.ecommerce.store.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.store.dto.request.AddressRequest;
import com.ecommerce.store.dto.response.AddressResponse;
import com.ecommerce.store.security.CurrentUserId;
import com.ecommerce.store.service.AddressService;

@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
class AddressController {

	private final AddressService addressService;

	@GetMapping
	Page<AddressResponse> list(@CurrentUserId Long userId, Pageable pageable) {
		return addressService.list(userId, pageable);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	AddressResponse create(@CurrentUserId Long userId, @Valid @RequestBody AddressRequest request) {
		return addressService.create(userId, request);
	}

	@PutMapping("/{id}")
	AddressResponse update(@CurrentUserId Long userId, @PathVariable Long id, @Valid @RequestBody AddressRequest request) {
		return addressService.update(userId, id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@CurrentUserId Long userId, @PathVariable Long id) {
		addressService.delete(userId, id);
	}

}
