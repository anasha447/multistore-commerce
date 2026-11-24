package com.ecommerce.store.service.interfaces;

import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;

/** Register and sign in. */
public interface AuthService {

	UserResponse register(RegisterRequest request);

	/** Every way to fail looks the same and takes as long. */
	TokenResponse login(LoginRequest request);

}
