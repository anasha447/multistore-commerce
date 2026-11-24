package com.ecommerce.store;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;

/** The whole app on a random port against real Postgres and Redis. Rate limits have their own tests. */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = "store.rate-limits=false")
@ContextConfiguration(initializers = Containers.class)
@Import({ TestClock.Configuration.class, Api.Configuration.class, People.Configuration.class })
public @interface IntegrationTest {

}
