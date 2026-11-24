package com.ecommerce.store.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import com.ecommerce.store.Api;
import com.ecommerce.store.Containers;
import com.ecommerce.store.IntegrationTest;
import com.ecommerce.store.People;
import com.ecommerce.store.People.Person;

@IntegrationTest
@TestPropertySource(properties = { "store.rate-limits=true", "store.requests-per-second=100000" })
class RateLimitTests extends RateLimitCases {

	@Autowired
	private Api api;

	@Autowired
	private People people;

	/** Otherwise slowing Redis down would be a way to get a second allowance. */
	@Test
	void aHiccupOfRedisGivesNobodyMore() throws Exception {
		Person person = people.customer();
		int allowed = 0;
		for (int i = 0; i < 260; i++) {
			if (i == 60) {
				docker("pause");
			}
			if (i == 130) {
				docker("unpause");
				// until the circuit breaker asks Redis again
				Thread.sleep(6000);
			}
			if (api.put("/api/users/me", Map.of("firstName", "A", "lastName", "B"), person.accessToken()).status() == 200) {
				allowed++;
			}
		}
		assertThat(allowed).isBetween(100, 120);
	}

	private static void docker(String what) throws Exception {
		var docker = Containers.REDIS.getDockerClient();
		if (what.equals("pause")) {
			docker.pauseContainerCmd(Containers.REDIS.getContainerId()).exec();
		}
		else {
			docker.unpauseContainerCmd(Containers.REDIS.getContainerId()).exec();
		}
	}

}
