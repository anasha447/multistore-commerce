package com.ecommerce.store.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Every copy reads the accounts disabled a moment ago, because Redis may have lost them. */
@Component
@EnableScheduling
@ConditionalOnBooleanProperty(name = "store.jobs", matchIfMissing = true)
@RequiredArgsConstructor
class DeniedAccountsJob {

	private final DeniedAccounts deniedAccounts;

	@Scheduled(fixedDelayString = "PT5S")
	void readDisabledAccounts() {
		deniedAccounts.readFromDatabase();
	}

}
