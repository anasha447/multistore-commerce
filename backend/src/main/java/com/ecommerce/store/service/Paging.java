package com.ecommerce.store.service;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.ecommerce.store.exception.ApiException;

/** Sorting only by fields a list offers; everything else is refused. Never by id. */
public final class Paging {

	private Paging() {
	}

	public static Pageable sorted(Pageable asked, Sort usual, String... offered) {
		asked.getSort().forEach(order -> {
			if (!Set.of(offered).contains(order.getProperty())) {
				throw ApiException.badRequest("Unknown sort field: " + order.getProperty());
			}
		});
		return PageRequest.of(asked.getPageNumber(), asked.getPageSize(), asked.getSortOr(usual));
	}

	/** A page of a short list that is already in creation order. */
	public static <T> Page<T> slice(List<T> all, Pageable asked) {
		Pageable page = sorted(asked, Sort.by("createdAt"), "createdAt");
		boolean newestFirst = page.getSort().stream().anyMatch(Sort.Order::isDescending);
		List<T> content = (newestFirst ? all.reversed() : all).stream().skip(page.getOffset()).limit(page.getPageSize()).toList();
		return new PageImpl<>(content, page, all.size());
	}

}
