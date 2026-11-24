package com.ecommerce.store.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import com.ecommerce.store.model.enums.AddressType;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
public class Address extends BaseEntity {

	private Long userId;

	private String line1;

	private String line2;

	private String city;

	private String state;

	private String postalCode;

	private String country;

	@Enumerated(EnumType.STRING)
	private AddressType type;

	@Column(name = "is_default")
	private boolean defaultAddress;

	@CreationTimestamp
	private Instant createdAt;

}
