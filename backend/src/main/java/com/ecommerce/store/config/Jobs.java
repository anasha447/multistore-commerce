package com.ecommerce.store.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** What every copy of the app does for itself, again and again. See also DeniedAccountsJob. */
@Component
@EnableScheduling
@ConditionalOnBooleanProperty(name = "store.jobs", matchIfMissing = true)
@RequiredArgsConstructor
class Jobs {

	private final StoreCacheManager caches;

	@Scheduled(fixedDelayString = "PT2S")
	void repeatFailedClears() {
		caches.repeatFailedClears();
	}

}
