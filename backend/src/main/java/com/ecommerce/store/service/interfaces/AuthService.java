package com.ecommerce.store.service.interfaces;

import com.ecommerce.store.dto.request.ChangePasswordRequest;
import com.ecommerce.store.dto.request.LoginRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.dto.response.UserResponse;

/** Register, sign in and out, and change the password. */
public interface AuthService {

	UserResponse register(RegisterRequest request);

	/** Every way to fail looks the same and takes as long. */
	TokenResponse login(LoginRequest request);

	/** Works once per token. A used one shown again later ends the whole sign-in. */
	TokenResponse refresh(String refreshToken);

	/** Ends the sign-in the token belongs to. Unknown tokens are fine. */
	void logout(String refreshToken);

	/** Ends every sign-in of the account. */
	void changePassword(Long userId, ChangePasswordRequest request);

}
