package com.ecommerce.fixtures;

import com.ecommerce.store.platform.PublicEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Outside the app's package, so the app never maps it. */
@Entity
@Table(name = "sample_things")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SampleThing extends PublicEntity {

	private String name;

	public SampleThing(String name) {
		this.name = name;
	}

}
