# DTO reference (generated from the old source, do not edit by hand)

Generated from the Java records of the old backend. Field names, order, types and validation are the
contract: the JSON must match exactly. `BigDecimal` is a JSON number; `Instant` is an ISO-8601 UTC string.
Null response fields are sent as `null`. Nested types (`Counts`, `Revenue`, ...) belong to the response listed above them.
Unknown request fields are ignored, as today.

Changed by hand since: every text a request sends has a maximum length, so `LoginRequest`,
`RefreshRequest` and `ChangePasswordRequest.currentPassword` gained `Size(max)`. No account can have a
longer password, and refresh tokens have 43 characters, so nothing the storefront sends is refused.

## Identity requests

### AddressRequest

| Field | Type | Rules |
|---|---|---|
| `line1` | `String` | NotBlank |
| `line2` | `String` |  |
| `city` | `String` | NotBlank |
| `state` | `String` |  |
| `postalCode` | `String` | NotBlank |
| `country` | `String` | NotBlank |
| `type` | `AddressType` | NotNull |
| `isDefault` | `boolean` |  |

### ChangePasswordRequest

| Field | Type | Rules |
|---|---|---|
| `currentPassword` | `String` | NotBlank, Size(max = 100) |
| `newPassword` | `String` | NotBlank, Size(min = 8, max = 100) |

### CreateStaffRequest

| Field | Type | Rules |
|---|---|---|
| `email` | `String` | NotBlank, Email |
| `password` | `String` | NotBlank, Size(min = 8, max = 100) |
| `firstName` | `String` | NotBlank |
| `lastName` | `String` | NotBlank |
| `phone` | `String` |  |

### LoginRequest

| Field | Type | Rules |
|---|---|---|
| `email` | `String` | NotBlank, Email, Size(max = 255) |
| `password` | `String` | NotBlank, Size(max = 100) |

### RefreshRequest

| Field | Type | Rules |
|---|---|---|
| `refreshToken` | `String` | NotBlank, Size(max = 100) |

### RegisterRequest

| Field | Type | Rules |
|---|---|---|
| `email` | `String` | NotBlank, Email |
| `password` | `String` | NotBlank, Size(min = 8, max = 100) |
| `firstName` | `String` | NotBlank |
| `lastName` | `String` | NotBlank |
| `phone` | `String` |  |

### UpdateProfileRequest

| Field | Type | Rules |
|---|---|---|
| `firstName` | `String` | NotBlank |
| `lastName` | `String` | NotBlank |
| `phone` | `String` |  |

### UpdateUserStatusRequest

| Field | Type | Rules |
|---|---|---|
| `enabled` | `Boolean` | NotNull |

## Identity responses

### AddressResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `line1` | `String` |  |
| `line2` | `String` |  |
| `city` | `String` |  |
| `state` | `String` |  |
| `postalCode` | `String` |  |
| `country` | `String` |  |
| `type` | `AddressType` |  |
| `isDefault` | `boolean` |  |

### AdminUserResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `email` | `String` |  |
| `firstName` | `String` |  |
| `lastName` | `String` |  |
| `phone` | `String` |  |
| `roles` | `Set<Role>` |  |
| `enabled` | `boolean` |  |
| `mustChangePassword` | `boolean` |  |
| `createdAt` | `Instant` |  |

### CustomerAnalyticsResponse

| Field | Type | Rules |
|---|---|---|
| `totalUsers` | `long` |  |
| `totalCustomers` | `long` |  |
| `newThisMonth` | `long` |  |
| `newThisYear` | `long` |  |
| `usersByRole` | `Map<String, Long>` |  |

### TokenResponse

| Field | Type | Rules |
|---|---|---|
| `accessToken` | `String` |  |
| `refreshToken` | `String` |  |
| `tokenType` | `String` |  |
| `expiresIn` | `long` |  |

### UserResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `email` | `String` |  |
| `firstName` | `String` |  |
| `lastName` | `String` |  |
| `phone` | `String` |  |
| `roles` | `Set<Role>` |  |
| `mustChangePassword` | `boolean` |  |

## Catalog, promotions, engagement requests

### CategoryRequest

| Field | Type | Rules |
|---|---|---|
| `parentId` | `Long` |  |
| `name` | `String` | NotBlank |
| `slug` | `String` | NotBlank |
| `description` | `String` |  |
| `imageUrl` | `String` |  |
| `displayOrder` | `int` |  |

### ContactQueryRequest

| Field | Type | Rules |
|---|---|---|
| `email` | `String` | NotBlank, Email, Size(max = 320) |
| `queryType` | `String` | NotBlank, Size(max = 120) |
| `message` | `String` | NotBlank, Size(max = 4000) |

### ContactQueryStatusRequest

| Field | Type | Rules |
|---|---|---|
| `status` | `ContactQueryStatus` | NotNull |

### CouponRequest

| Field | Type | Rules |
|---|---|---|
| `code` | `String` | NotBlank |
| `discountType` | `DiscountType` | NotNull |
| `discountValue` | `BigDecimal` | NotNull, DecimalMin("0.0") |
| `minSpend` | `BigDecimal` | DecimalMin("0.0") |
| `maxUses` | `Integer` | Min(1) |
| `perUserLimit` | `Integer` | Min(1) |
| `validFrom` | `Instant` | NotNull |
| `validUntil` | `Instant` | NotNull |
| `active` | `Boolean` |  |

### CouponValidateRequest

| Field | Type | Rules |
|---|---|---|
| `code` | `String` | NotBlank |
| `subtotal` | `BigDecimal` | NotNull, DecimalMin("0.0") |

### DiscountRequest

| Field | Type | Rules |
|---|---|---|
| `productId` | `Long` |  |
| `categoryId` | `Long` |  |
| `type` | `DiscountType` | NotNull |
| `value` | `BigDecimal` | NotNull, DecimalMin("0.0") |
| `validFrom` | `Instant` | NotNull |
| `validTo` | `Instant` | NotNull |
| `active` | `Boolean` |  |

### ProductImageRequest

| Field | Type | Rules |
|---|---|---|
| `variantId` | `Long` |  |
| `url` | `String` | NotBlank |
| `altText` | `String` |  |
| `displayOrder` | `int` |  |
| `primary` | `boolean` |  |

### ProductRequest

| Field | Type | Rules |
|---|---|---|
| `categoryId` | `Long` | NotNull |
| `name` | `String` | NotBlank |
| `slug` | `String` | NotBlank |
| `description` | `String` |  |
| `basePrice` | `BigDecimal` | NotNull, DecimalMin(value = "0.0", inclusive = true) |
| `brand` | `String` |  |
| `stockQuantity` | `Integer` | Min(0) |

### ProductVariantRequest

| Field | Type | Rules |
|---|---|---|
| `sku` | `String` |  |
| `size` | `String` |  |
| `color` | `String` |  |
| `priceOverride` | `BigDecimal` | DecimalMin(value = "0.0") |
| `stockQuantity` | `Integer` | NotNull, Min(0) |
| `restockLevel` | `Integer` |  |

### ReviewRequest

| Field | Type | Rules |
|---|---|---|
| `rating` | `int` | Min(1), Max(5) |
| `text` | `String` | Size(max = 4000) |

### SubscribeRequest

| Field | Type | Rules |
|---|---|---|
| `email` | `String` | NotBlank, Email, Size(max = 320) |

### WishlistItemRequest

| Field | Type | Rules |
|---|---|---|
| `productVariantId` | `Long` | NotNull |

## Catalog, promotions, engagement responses

### CatalogAnalyticsResponse

| Field | Type | Rules |
|---|---|---|
| `counts` | `Counts` |  |
| `inventory` | `Inventory` |  |
| `totalReviews` | `long` |  |
| `promotions` | `Promotions` |  |

### Counts

| Field | Type | Rules |
|---|---|---|
| `products` | `long` |  |
| `variants` | `long` |  |
| `categories` | `long` |  |

### Inventory

| Field | Type | Rules |
|---|---|---|
| `totalValue` | `BigDecimal` |  |
| `lowStock` | `long` |  |
| `outOfStock` | `long` |  |

### Promotions

| Field | Type | Rules |
|---|---|---|
| `activeCoupons` | `long` |  |
| `activeDiscounts` | `long` |  |

### CategoryResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `parentId` | `Long` |  |
| `name` | `String` |  |
| `slug` | `String` |  |
| `description` | `String` |  |
| `imageUrl` | `String` |  |
| `displayOrder` | `int` |  |
| `active` | `boolean` |  |
| `children` | `List<CategoryResponse>` |  |

### ContactQueryResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `email` | `String` |  |
| `queryType` | `String` |  |
| `message` | `String` |  |
| `status` | `ContactQueryStatus` |  |
| `createdAt` | `Instant` |  |

### CouponResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `code` | `String` |  |
| `discountType` | `DiscountType` |  |
| `discountValue` | `BigDecimal` |  |
| `minSpend` | `BigDecimal` |  |
| `maxUses` | `Integer` |  |
| `usedCount` | `int` |  |
| `perUserLimit` | `Integer` |  |
| `validFrom` | `Instant` |  |
| `validUntil` | `Instant` |  |
| `active` | `boolean` |  |

### CouponValidationResponse

| Field | Type | Rules |
|---|---|---|
| `valid` | `boolean` |  |
| `code` | `String` |  |
| `discountType` | `DiscountType` |  |
| `discountValue` | `BigDecimal` |  |
| `discountAmount` | `BigDecimal` |  |
| `message` | `String` |  |

### DiscountResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productId` | `Long` |  |
| `categoryId` | `Long` |  |
| `type` | `DiscountType` |  |
| `value` | `BigDecimal` |  |
| `validFrom` | `Instant` |  |
| `validTo` | `Instant` |  |
| `active` | `boolean` |  |
| `createdBy` | `Long` |  |

### LowStockItemResponse

| Field | Type | Rules |
|---|---|---|
| `variantId` | `Long` |  |
| `sku` | `String` |  |
| `stockQuantity` | `int` |  |
| `restockLevel` | `int` |  |

### MostWishlistedResponse

| Field | Type | Rules |
|---|---|---|
| `productVariantId` | `Long` |  |
| `sku` | `String` |  |
| `wishlistCount` | `long` |  |

### ProductImageResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productId` | `Long` |  |
| `variantId` | `Long` |  |
| `url` | `String` |  |
| `altText` | `String` |  |
| `displayOrder` | `int` |  |
| `primary` | `boolean` |  |

### ProductResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `categoryId` | `Long` |  |
| `name` | `String` |  |
| `slug` | `String` |  |
| `description` | `String` |  |
| `basePrice` | `BigDecimal` |  |
| `brand` | `String` |  |
| `active` | `boolean` |  |
| `createdAt` | `Instant` |  |

### ProductVariantResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productId` | `Long` |  |
| `sku` | `String` |  |
| `size` | `String` |  |
| `color` | `String` |  |
| `priceOverride` | `BigDecimal` |  |
| `listPrice` | `BigDecimal` |  |
| `effectivePrice` | `BigDecimal` |  |
| `stockQuantity` | `int` |  |
| `restockLevel` | `Integer` |  |
| `active` | `boolean` |  |
| `defaultVariant` | `boolean` |  |

### ReviewResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productId` | `Long` |  |
| `userId` | `Long` |  |
| `rating` | `int` |  |
| `text` | `String` |  |
| `createdAt` | `Instant` |  |

### ReviewSummaryResponse

| Field | Type | Rules |
|---|---|---|
| `productId` | `Long` |  |
| `averageRating` | `double` |  |
| `reviewCount` | `long` |  |

### SubscribeResponse

| Field | Type | Rules |
|---|---|---|
| `email` | `String` |  |
| `couponCode` | `String` |  |
| `discountPercent` | `int` |  |
| `message` | `String` |  |

### SubscriberResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `email` | `String` |  |
| `couponCode` | `String` |  |
| `createdAt` | `Instant` |  |

### TopRatedProductResponse

| Field | Type | Rules |
|---|---|---|
| `productId` | `Long` |  |
| `productName` | `String` |  |
| `averageRating` | `double` |  |
| `reviewCount` | `long` |  |

### VariantPriceStockResponse

| Field | Type | Rules |
|---|---|---|
| `variantId` | `Long` |  |
| `productId` | `Long` |  |
| `sku` | `String` |  |
| `productName` | `String` |  |
| `effectivePrice` | `BigDecimal` |  |
| `stockQuantity` | `int` |  |
| `available` | `boolean` |  |

### WishlistItemResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productVariantId` | `Long` |  |
| `addedAt` | `Instant` |  |

### WishlistResponse

| Field | Type | Rules |
|---|---|---|
| `userId` | `Long` |  |
| `items` | `List<WishlistItemResponse>` |  |

## Cart, orders, sales analytics requests

### CartItemRequest

| Field | Type | Rules |
|---|---|---|
| `productVariantId` | `Long` | NotNull |
| `quantity` | `Integer` | NotNull, Min(1), Max(value = 20) |

### CartPriceRequest

| Field | Type | Rules |
|---|---|---|
| `items` | `List<@Valid CartItemRequest>` | NotNull, Size(max = 50) |

### CheckoutRequest

| Field | Type | Rules |
|---|---|---|
| `shippingAddress` | `ShippingAddressRequest` | NotNull, Valid |
| `paymentMethod` | `PaymentMethod` | NotNull |
| `couponCode` | `String` | Size(max = 64) |
| `shippingMethod` | `String` | Size(max = 64) |

### GuestCheckoutRequest

| Field | Type | Rules |
|---|---|---|
| `guestEmail` | `String` | NotBlank, Email |
| `items` | `List<@Valid CartItemRequest>` | NotEmpty, Size(max = 50) |
| `shippingAddress` | `ShippingAddressRequest` | NotNull, Valid |
| `paymentMethod` | `PaymentMethod` | NotNull |
| `couponCode` | `String` | Size(max = 64) |
| `shippingMethod` | `String` | Size(max = 64) |

### ShippingAddressRequest

| Field | Type | Rules |
|---|---|---|
| `recipientName` | `String` | NotBlank |
| `line1` | `String` | NotBlank |
| `line2` | `String` |  |
| `city` | `String` | NotBlank |
| `state` | `String` |  |
| `postalCode` | `String` | NotBlank |
| `country` | `String` | NotBlank |
| `phone` | `String` |  |

### UpdateCartItemRequest

| Field | Type | Rules |
|---|---|---|
| `quantity` | `Integer` | NotNull, Min(1), Max(value = 20) |

### UpdateOrderStatusRequest

| Field | Type | Rules |
|---|---|---|
| `status` | `OrderStatus` | NotNull |
| `note` | `String` |  |

### UpdateShippingRequest

| Field | Type | Rules |
|---|---|---|
| `shippingMethod` | `String` | NotBlank |
| `trackingNumber` | `String` |  |

## Cart, orders, sales analytics responses

### CartLineResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productVariantId` | `Long` |  |
| `productName` | `String` |  |
| `sku` | `String` |  |
| `unitPrice` | `BigDecimal` |  |
| `quantity` | `int` |  |
| `lineTotal` | `BigDecimal` |  |
| `available` | `boolean` |  |
| `stockQuantity` | `int` |  |

### CartResponse

| Field | Type | Rules |
|---|---|---|
| `cartId` | `Long` |  |
| `userId` | `Long` |  |
| `items` | `List<CartLineResponse>` |  |
| `subtotal` | `BigDecimal` |  |

### OrderItemResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `productVariantId` | `Long` |  |
| `productName` | `String` |  |
| `sku` | `String` |  |
| `unitPrice` | `BigDecimal` |  |
| `quantity` | `int` |  |
| `lineTotal` | `BigDecimal` |  |

### OrderResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `orderNumber` | `String` |  |
| `userId` | `Long` |  |
| `status` | `OrderStatus` |  |
| `subtotal` | `BigDecimal` |  |
| `discountAmount` | `BigDecimal` |  |
| `total` | `BigDecimal` |  |
| `couponCode` | `String` |  |
| `shippingAddress` | `String` |  |
| `paymentStatus` | `PaymentStatus` |  |
| `paymentMethod` | `PaymentMethod` |  |
| `transactionId` | `String` |  |
| `shippingStatus` | `ShippingStatus` |  |
| `shippingMethod` | `String` |  |
| `trackingNumber` | `String` |  |
| `items` | `List<OrderItemResponse>` |  |
| `createdAt` | `Instant` |  |

### OrderStatusHistoryResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `fromStatus` | `OrderStatus` |  |
| `toStatus` | `OrderStatus` |  |
| `note` | `String` |  |
| `changedBy` | `Long` |  |
| `changedAt` | `Instant` |  |

### OrderSummaryResponse

| Field | Type | Rules |
|---|---|---|
| `id` | `Long` |  |
| `orderNumber` | `String` |  |
| `userId` | `Long` |  |
| `status` | `OrderStatus` |  |
| `total` | `BigDecimal` |  |
| `paymentStatus` | `PaymentStatus` |  |
| `shippingStatus` | `ShippingStatus` |  |
| `createdAt` | `Instant` |  |

### RevenueTrendPoint

| Field | Type | Rules |
|---|---|---|
| `month` | `String` |  |
| `revenue` | `BigDecimal` |  |

### SalesAnalyticsResponse

| Field | Type | Rules |
|---|---|---|
| `revenue` | `Revenue` |  |
| `totalOrders` | `long` |  |
| `ordersByStatus` | `Map<String, Long>` |  |
| `averageOrderValue` | `BigDecimal` |  |
| `totalDiscountsGiven` | `BigDecimal` |  |
| `couponRedemptions` | `long` |  |
| `refunds` | `Refunds` |  |
| `revenueByPaymentMethod` | `List<PaymentMethodRevenue>` |  |
| `operations` | `Operations` |  |

### Revenue

| Field | Type | Rules |
|---|---|---|
| `today` | `BigDecimal` |  |
| `thisWeek` | `BigDecimal` |  |
| `thisMonth` | `BigDecimal` |  |
| `thisYear` | `BigDecimal` |  |
| `allTime` | `BigDecimal` |  |
| `monthOverMonthPct` | `Double` |  |

### Refunds

| Field | Type | Rules |
|---|---|---|
| `count` | `long` |  |
| `amount` | `BigDecimal` |  |

### PaymentMethodRevenue

| Field | Type | Rules |
|---|---|---|
| `paymentMethod` | `String` |  |
| `orders` | `long` |  |
| `revenue` | `BigDecimal` |  |

### Operations

| Field | Type | Rules |
|---|---|---|
| `awaitingPayment` | `long` |  |
| `awaitingShipment` | `long` |  |
| `avgHoursToShip` | `Double` |  |

### StateOrderCountResponse

| Field | Type | Rules |
|---|---|---|
| `state` | `String` |  |
| `orderCount` | `long` |  |

### TopCustomerResponse

| Field | Type | Rules |
|---|---|---|
| `userId` | `Long` |  |
| `orders` | `long` |  |
| `totalSpent` | `BigDecimal` |  |

### TopProductResponse

| Field | Type | Rules |
|---|---|---|
| `productVariantId` | `Long` |  |
| `sku` | `String` |  |
| `productName` | `String` |  |
| `unitsSold` | `long` |  |
| `revenue` | `BigDecimal` |  |

## Error shape

- `timestamp`: `Instant`
- `status`: `int`
- `error`: `String`
- `message`: `String`
- `path`: `String`
- `fieldErrors`: `Map<String, String>`
- `code`: `String`

Null fields are omitted (`JsonInclude.NON_NULL`).

## Enums

- `AddressType`: `HOME`, `WORK`, `OTHER`
- `ContactQueryStatus`: `OPEN`, `RESOLVED`
- `DiscountType`: `PERCENTAGE`, `FIXED_AMOUNT`
- `OrderStatus`: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `PaymentMethod`: `CARD`, `PAYPAL`, `COD`, `ONLINE`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- `Role`: `ADMIN`, `MANAGER`, `CUSTOMER`
- `ShippingStatus`: `PENDING`, `SHIPPED`, `DELIVERED`, `RETURNED`

## Endpoint signatures

| Method | Path | Parameters | Returns | Success |
|---|---|---|---|---|
| GET | `/api/analytics/catalog` |  | `CatalogAnalyticsResponse` | 200 |
| GET | `/api/analytics/catalog/low-stock` | query `limit` int (defaultValue = "20") | `List<LowStockItemResponse>` | 200 |
| GET | `/api/analytics/catalog/top-rated` | query `limit` int (defaultValue = "10") | `List<TopRatedProductResponse>` | 200 |
| GET | `/api/analytics/catalog/most-wishlisted` | query `limit` int (defaultValue = "10") | `List<MostWishlistedResponse>` | 200 |
| GET | `/api/categories` |  | `List<CategoryResponse>` | 200 |
| GET | `/api/categories/tree` |  | `List<CategoryResponse>` | 200 |
| GET | `/api/categories/{id}` | path `id` | `CategoryResponse` | 200 |
| GET | `/api/categories/{id}/children` | path `id` | `List<CategoryResponse>` | 200 |
| POST | `/api/categories` | body `CategoryRequest` | `CategoryResponse` | 201 |
| PUT | `/api/categories/{id}` | path `id`; body `CategoryRequest` | `CategoryResponse` | 200 |
| DELETE | `/api/categories/{id}` | path `id` | `void` | 204 |
| POST | `/api/contact` | body `ContactQueryRequest` | `ContactQueryResponse` | 201 |
| GET | `/api/contact` | `page,size,sort` | `Page<ContactQueryResponse>` | 200 |
| PATCH | `/api/contact/{id}/status` | path `id`; body `ContactQueryStatusRequest` | `ContactQueryResponse` | 200 |
| GET | `/api/coupons` | `page,size,sort` | `Page<CouponResponse>` | 200 |
| GET | `/api/coupons/{id}` | path `id` | `CouponResponse` | 200 |
| POST | `/api/coupons` | body `CouponRequest` | `CouponResponse` | 201 |
| PUT | `/api/coupons/{id}` | path `id`; body `CouponRequest` | `CouponResponse` | 200 |
| DELETE | `/api/coupons/{id}` | path `id` | `void` | 204 |
| POST | `/api/coupons/validate` | body `CouponValidateRequest` | `CouponValidationResponse` | 200 |
| GET | `/api/products/{productId}/discounts` | path `productId` | `List<DiscountResponse>` | 200 |
| GET | `/api/discounts/{id}` | path `id` | `DiscountResponse` | 200 |
| POST | `/api/discounts` | body `DiscountRequest` | `DiscountResponse` | 201 |
| PUT | `/api/discounts/{id}` | path `id`; body `DiscountRequest` | `DiscountResponse` | 200 |
| DELETE | `/api/discounts/{id}` | path `id` | `void` | 204 |
| GET | `/api/products` | query `categoryId` Long (required = false); `page,size,sort` | `Page<ProductResponse>` | 200 |
| GET | `/api/products/{id}` | path `id` | `ProductResponse` | 200 |
| GET | `/api/products/slug/{slug}` | path `slug` | `ProductResponse` | 200 |
| POST | `/api/products` | body `ProductRequest` | `ProductResponse` | 201 |
| PUT | `/api/products/{id}` | path `id`; body `ProductRequest` | `ProductResponse` | 200 |
| DELETE | `/api/products/{id}` | path `id` | `void` | 204 |
| GET | `/api/products/{productId}/images` | path `productId` | `List<ProductImageResponse>` | 200 |
| POST | `/api/products/{productId}/images` | path `productId`; body `ProductImageRequest` | `ProductImageResponse` | 201 |
| POST | `/api/products/{productId}/images/upload` | path `productId`; query `file` MultipartFile ("file"); query `variantId` Long (value = "variantId", required = false); query `altText` String (value = "altText", required = false); query `displayOrder` int (value = "displayOrder", defaultValue = "0"); query `primary` boolean (value = "primary", defaultValue = "false") | `ProductImageResponse` | 201 |
| PUT | `/api/images/{imageId}` | path `imageId`; body `ProductImageRequest` | `ProductImageResponse` | 200 |
| DELETE | `/api/images/{imageId}` | path `imageId` | `void` | 204 |
| GET | `/api/products/{productId}/variants` | path `productId` | `List<ProductVariantResponse>` | 200 |
| POST | `/api/products/{productId}/variants` | path `productId`; body `ProductVariantRequest` | `ProductVariantResponse` | 201 |
| GET | `/api/variants/{id}` | path `id` | `VariantPriceStockResponse` | 200 |
| PUT | `/api/variants/{id}` | path `id`; body `ProductVariantRequest` | `ProductVariantResponse` | 200 |
| DELETE | `/api/variants/{id}` | path `id` | `void` | 204 |
| GET | `/api/products/{productId}/reviews` | path `productId`; `page,size,sort` | `Page<ReviewResponse>` | 200 |
| GET | `/api/products/{productId}/reviews/summary` | path `productId` | `ReviewSummaryResponse` | 200 |
| POST | `/api/products/{productId}/reviews` | path `productId`; body `ReviewRequest` | `ReviewResponse` | 201 |
| PUT | `/api/reviews/{reviewId}` | path `reviewId`; body `ReviewRequest` | `ReviewResponse` | 200 |
| DELETE | `/api/reviews/{reviewId}` | path `reviewId` | `void` | 204 |
| POST | `/api/subscribers` | body `SubscribeRequest` | `SubscribeResponse` | 201 |
| GET | `/api/subscribers` | `page,size,sort` | `Page<SubscriberResponse>` | 200 |
| GET | `/api/wishlist` |  | `WishlistResponse` | 200 |
| POST | `/api/wishlist/items` | body `WishlistItemRequest` | `WishlistItemResponse` | 201 |
| DELETE | `/api/wishlist/items/{itemId}` | path `itemId` | `void` | 204 |
| GET | `/media/{store}/{32 hex}.webp` | path `folder`; path `file` | `ResponseEntity<byte[]>` | 200 |
| GET | `/api/analytics/sales` |  | `SalesAnalyticsResponse` | 200 |
| GET | `/api/analytics/sales/revenue-trend` | query `months` int (defaultValue = "12") | `List<RevenueTrendPoint>` | 200 |
| GET | `/api/analytics/sales/top-products` | query `limit` int (defaultValue = "10") | `List<TopProductResponse>` | 200 |
| GET | `/api/analytics/sales/top-customers` | query `limit` int (defaultValue = "10") | `List<TopCustomerResponse>` | 200 |
| GET | `/api/analytics/sales/orders-by-state` |  | `List<StateOrderCountResponse>` | 200 |
| GET | `/api/cart` |  | `CartResponse` | 200 |
| POST | `/api/cart/price` | body `CartPriceRequest` | `CartResponse` | 200 |
| POST | `/api/cart/items` | body `CartItemRequest` | `CartResponse` | 201 |
| PUT | `/api/cart/items/{itemId}` | path `itemId`; body `UpdateCartItemRequest` | `CartResponse` | 200 |
| DELETE | `/api/cart/items/{itemId}` | path `itemId` | `void` | 204 |
| DELETE | `/api/cart` |  | `void` | 204 |
| POST | `/api/orders` | body `CheckoutRequest`; header `Idempotency-Key` | `OrderResponse` | 201 |
| POST | `/api/orders/guest` | body `GuestCheckoutRequest`; header `Idempotency-Key` | `OrderResponse` | 201 |
| GET | `/api/orders/payment-methods` |  | `Map<String, List<PaymentMethod>>` | 200 |
| GET | `/api/orders/track` | query `number` String; query `email` String | `OrderResponse` | 200 |
| GET | `/api/orders` | `page,size,sort` | `Page<OrderSummaryResponse>` | 200 |
| GET | `/api/orders/{id}` | path `id` | `OrderResponse` | 200 |
| GET | `/api/orders/by-number/{orderNumber}` | path `orderNumber` | `OrderResponse` | 200 |
| POST | `/api/orders/{id}/cancel` | path `id` | `OrderResponse` | 200 |
| GET | `/api/orders/{id}/history` | path `id` | `List<OrderStatusHistoryResponse>` | 200 |
| GET | `/api/orders/admin` | query `status` OrderStatus (required = false); `page,size,sort` | `Page<OrderSummaryResponse>` | 200 |
| PUT | `/api/orders/{id}/status` | path `id`; body `UpdateOrderStatusRequest` | `OrderResponse` | 200 |
| PUT | `/api/orders/{id}/shipping` | path `id`; body `UpdateShippingRequest` | `OrderResponse` | 200 |
| GET | `/api/users/me/addresses` | `page,size,sort` | `Page<AddressResponse>` | 200 |
| POST | `/api/users/me/addresses` | body `AddressRequest` | `AddressResponse` | 201 |
| PUT | `/api/users/me/addresses/{id}` | path `id`; body `AddressRequest` | `AddressResponse` | 200 |
| DELETE | `/api/users/me/addresses/{id}` | path `id` | `void` | 204 |
| POST | `/api/admin/users` | body `CreateStaffRequest` | `AdminUserResponse` | 201 |
| GET | `/api/admin/users` | query `role` Role (required = false); query `enabled` Boolean (required = false); `page,size,sort` | `Page<AdminUserResponse>` | 200 |
| GET | `/api/admin/users/{id}` | path `id` | `AdminUserResponse` | 200 |
| PUT | `/api/admin/users/{id}/status` | path `id`; body `UpdateUserStatusRequest` | `AdminUserResponse` | 200 |
| POST | `/api/auth/register` | body `RegisterRequest` | `UserResponse` | 201 |
| POST | `/api/auth/login` | body `LoginRequest` | `TokenResponse` | 200 |
| POST | `/api/auth/refresh` | body `RefreshRequest` | `TokenResponse` | 200 |
| POST | `/api/auth/logout` | body `RefreshRequest` | `void` | 204 |
| GET | `/api/analytics/customers` |  | `CustomerAnalyticsResponse` | 200 |
| GET | `/api/users/me` |  | `UserResponse` | 200 |
| PUT | `/api/users/me` | body `UpdateProfileRequest` | `UserResponse` | 200 |
| PUT | `/api/users/me/password` | body `ChangePasswordRequest` | `void` | 204 |

Total: 91 endpoints.
