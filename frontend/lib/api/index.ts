// Public entry point for the data layer.
//
//   import { api } from '@/lib/api';
//   const products = await api.products.list({ categoryId: 1, page: 0, size: 20 });
//
// Types are re-exported here too:
//   import { api, type ProductResponse, ApiError } from '@/lib/api';

import { authApi } from './endpoints/auth';
import { usersApi } from './endpoints/users';
import { categoriesApi } from './endpoints/categories';
import { productsApi } from './endpoints/products';
import { variantsApi } from './endpoints/variants';
import { imagesApi } from './endpoints/images';
import { reviewsApi } from './endpoints/reviews';
import { discountsApi } from './endpoints/discounts';
import { couponsApi } from './endpoints/coupons';
import { cartApi } from './endpoints/cart';
import { ordersApi } from './endpoints/orders';
import { wishlistApi } from './endpoints/wishlist';
import { analyticsApi } from './endpoints/analytics';
import { adminApi } from './endpoints/admin';
import { contactApi } from './endpoints/contact';
import { subscribersApi } from './endpoints/subscribers';

/** Grouped façade over every endpoint module. */
export const api = {
  auth: authApi,
  users: usersApi,
  categories: categoriesApi,
  products: productsApi,
  variants: variantsApi,
  images: imagesApi,
  reviews: reviewsApi,
  discounts: discountsApi,
  coupons: couponsApi,
  cart: cartApi,
  orders: ordersApi,
  wishlist: wishlistApi,
  analytics: analyticsApi,
  admin: adminApi,
  contact: contactApi,
  subscribers: subscribersApi,
};

// Endpoint modules (also usable individually).
export { authApi } from './endpoints/auth';
export { usersApi } from './endpoints/users';
export { categoriesApi } from './endpoints/categories';
export { productsApi, type ProductListParams } from './endpoints/products';
export { variantsApi } from './endpoints/variants';
export { imagesApi } from './endpoints/images';
export { reviewsApi } from './endpoints/reviews';
export { discountsApi } from './endpoints/discounts';
export { couponsApi } from './endpoints/coupons';
export { cartApi } from './endpoints/cart';
export { ordersApi, type OrderAdminListParams } from './endpoints/orders';
export { wishlistApi } from './endpoints/wishlist';
export { analyticsApi } from './endpoints/analytics';
export { adminApi, type AdminUserListParams } from './endpoints/admin';
export { contactApi } from './endpoints/contact';
export { subscribersApi } from './endpoints/subscribers';

// Core: error type, transport, config, token storage.
export { ApiError, isApiError, type ApiErrorInit } from './errors';
export { http, type RequestOptions } from './http';
export { API_BASE_URL } from './config';
export {
  configureTokenStore,
  getTokenStore,
  InMemoryTokenStore,
  type TokenStore,
  type Tokens,
} from './tokenStore';

// All DTO types & enums.
export * from '@/lib/types';
