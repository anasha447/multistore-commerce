package com.ecommerce.store.security;

import org.springframework.test.context.TestPropertySource;

import com.ecommerce.store.IntegrationTest;

@IntegrationTest
@TestPropertySource(properties = { "store.rate-limits=true", "store.requests-per-second=100000" })
class RateLimitTests extends RateLimitCases {

}
