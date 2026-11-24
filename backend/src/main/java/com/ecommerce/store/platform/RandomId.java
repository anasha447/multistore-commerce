package com.ecommerce.store.platform;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.EnumSet;

import org.hibernate.annotations.IdGeneratorType;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;
import org.hibernate.generator.EventTypeSets;

/** Gives an entity its {@link PublicId} when it is first saved, before the insert. */
@IdGeneratorType(RandomId.Generator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RandomId {

	class Generator implements BeforeExecutionGenerator {

		@Override
		public Object generate(SharedSessionContractImplementor session, Object owner, Object currentValue,
				EventType eventType) {
			return PublicId.next();
		}

		@Override
		public EnumSet<EventType> getEventTypes() {
			return EventTypeSets.INSERT_ONLY;
		}

	}

}
