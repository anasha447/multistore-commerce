/** Checkout, orders, history, idempotency. */
@org.springframework.modulith.ApplicationModule(allowedDependencies = { "platform", "cart", "pricing", "inventory", "promotions", "payments" })
package com.ecommerce.store.orders;
