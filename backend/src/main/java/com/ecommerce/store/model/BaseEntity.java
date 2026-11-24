package com.ecommerce.store.model;

import java.security.SecureRandom;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import org.hibernate.Hibernate;

/**
 * An entity whose id leaves the app: a random 16-digit number that JavaScript can hold exactly, given
 * before the insert (ADR-0014). Equality goes through the getter: on a lazy proxy the field is empty.
 */
@Getter
@MappedSuperclass
public abstract class BaseEntity {

	public static final long MIN_ID = 1_000_000_000_000_000L;

	public static final long MAX_ID = 9_007_199_254_740_991L;

	private static final SecureRandom RANDOM = new SecureRandom();

	@Id
	@Column(updatable = false)
	private Long id;

	public static long newId() {
		return RANDOM.nextLong(MIN_ID, MAX_ID + 1);
	}

	@PrePersist
	void assignId() {
		if (id == null) {
			id = newId();
		}
	}

	@Override
	public final boolean equals(Object other) {
		return this == other || (getId() != null && other instanceof BaseEntity that
				&& Hibernate.getClassLazy(this) == Hibernate.getClassLazy(that) && getId().equals(that.getId()));
	}

	@Override
	public final int hashCode() {
		return Hibernate.getClassLazy(this).hashCode();
	}

}
