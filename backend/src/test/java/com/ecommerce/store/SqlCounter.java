package com.ecommerce.store;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import javax.sql.DataSource;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.DelegatingDataSource;

/** Counts the statements the app sends to Postgres. */
public class SqlCounter {

	private static final Set<String> STATEMENTS = Set.of("prepareStatement", "createStatement", "prepareCall");

	private final AtomicInteger count = new AtomicInteger();

	/** How many statements the call needed. */
	public int during(Runnable call) {
		int before = count.get();
		call.run();
		return count.get() - before;
	}

	private Connection counting(Connection connection) {
		return (Connection) Proxy.newProxyInstance(SqlCounter.class.getClassLoader(), new Class<?>[] { Connection.class },
				(proxy, method, arguments) -> {
					if (STATEMENTS.contains(method.getName())) {
						count.incrementAndGet();
					}
					try {
						return method.invoke(connection, arguments);
					}
					catch (InvocationTargetException ex) {
						throw ex.getTargetException();
					}
				});
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class Configuration {

		private static final SqlCounter COUNTER = new SqlCounter();

		@Bean
		SqlCounter sqlCounter() {
			return COUNTER;
		}

		@Bean
		static BeanPostProcessor countingDataSource() {
			return new BeanPostProcessor() {

				@Override
				public Object postProcessAfterInitialization(Object bean, String name) {
					return !(bean instanceof DataSource source) ? bean : new DelegatingDataSource(source) {

						@Override
						public Connection getConnection() throws SQLException {
							return COUNTER.counting(super.getConnection());
						}

					};
				}

			};
		}

	}

}
