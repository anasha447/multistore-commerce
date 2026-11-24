package com.ecommerce.store.config;

import java.time.Duration;
import java.util.List;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import tools.jackson.databind.type.TypeFactory;

import com.ecommerce.store.dto.response.AddressResponse;
import com.ecommerce.store.dto.response.UserResponse;

/** Outside transactions: a cached answer needs no connection, and clearing waits for the commit. */
@Configuration
@EnableCaching(order = 0)
class CacheConfig {

	@Bean
	StoreCacheManager cacheManager(RedisConnectionFactory connections, StringRedisTemplate redis, RedisGuard guard,
			StoreProperties store) {
		TypeFactory types = TypeFactory.createDefaultInstance();
		return new StoreCacheManager(connections, redis, guard, store.id(), List.of(
				new CacheSpec(CacheNames.ME, Duration.ofMinutes(5), types.constructType(UserResponse.class)),
				new CacheSpec(CacheNames.ADDRESSES, Duration.ofMinutes(5),
						types.constructCollectionType(List.class, AddressResponse.class))));
	}

}
