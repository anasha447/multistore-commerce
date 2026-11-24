package com.ecommerce.store.service;

import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.ecommerce.store.exception.ApiException;

/** Sorting only by fields a list offers; everything else is refused. Never by id. */
final class Paging {

	private Paging() {
	}

	static Pageable sorted(Pageable asked, Sort usual, String... offered) {
		asked.getSort().forEach(order -> {
			if (!Set.of(offered).contains(order.getProperty())) {
				throw ApiException.badRequest("Unknown sort field: " + order.getProperty());
			}
		});
		return PageRequest.of(asked.getPageNumber(), asked.getPageSize(), asked.getSortOr(usual));
	}

}
