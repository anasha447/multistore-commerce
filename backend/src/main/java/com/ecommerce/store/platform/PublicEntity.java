package com.ecommerce.store.platform;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.Hibernate;

/**
 * An entity whose id leaves the app. Equality goes through the getter: on a lazy proxy the field is
 * empty.
 */
@MappedSuperclass
@Getter
public abstract class PublicEntity {

	@Id
	@RandomId
	@Column(nullable = false, updatable = false)
	private Long id;

	@Override
	public final boolean equals(Object other) {
		return this == other || (getId() != null && other instanceof PublicEntity that
				&& Hibernate.getClassLazy(this) == Hibernate.getClassLazy(that) && getId().equals(that.getId()));
	}

	@Override
	public final int hashCode() {
		return Hibernate.getClassLazy(this).hashCode();
	}

}
