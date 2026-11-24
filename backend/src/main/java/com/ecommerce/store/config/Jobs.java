package com.ecommerce.store.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.ecommerce.store.security.DeniedAccounts;

/** What every copy of the app does for itself, again and again. */
@Component
@EnableScheduling
@ConditionalOnBooleanProperty(name = "store.jobs", matchIfMissing = true)
@RequiredArgsConstructor
class Jobs {

	private final StoreCacheManager caches;

	private final DeniedAccounts deniedAccounts;

	@Scheduled(fixedDelayString = "PT2S")
	void repeatFailedClears() {
		caches.repeatFailedClears();
	}

	@Scheduled(fixedDelayString = "PT5S")
	void readDisabledAccounts() {
		deniedAccounts.readFromDatabase();
	}

}
