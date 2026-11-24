package com.ecommerce.store.dto.response;

public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {
}
