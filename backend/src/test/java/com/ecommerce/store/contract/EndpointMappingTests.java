package com.ecommerce.store.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import com.ecommerce.store.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/** The app serves nothing outside the contract. */
@IntegrationTest
class EndpointMappingTests {

	@Autowired
	@Qualifier("requestMappingHandlerMapping")
	private RequestMappingHandlerMapping mappings;

	@Test
	void everyMappingIsInTheContract() {
		Set<String> known = Contract.load()
			.endpoints()
			.stream()
			.map(endpoint -> endpoint.method() + " " + endpoint.shape())
			.collect(Collectors.toSet());
		Set<String> served = new TreeSet<>();
		mappings.getHandlerMethods()
			.keySet()
			.forEach(info -> info.getPatternValues()
				.stream()
				.filter(path -> !path.equals("/error"))
				.forEach(path -> info.getMethodsCondition()
					.getMethods()
					.forEach(method -> served.add(method + " " + Contract.shapeOf(path)))));
		assertThat(served).isSubsetOf(known);
	}

}
