package com.ecommerce.store.service.interfaces;

import com.ecommerce.store.dto.response.TokenResponse;
import com.ecommerce.store.model.User;

/** Sign-ins and their refresh tokens. */
public interface RefreshTokenService {

	/** A new sign-in, unless the account was locked, disabled or given a new password meanwhile. */
	TokenResponse open(User user);

	/** Works once per token. A used one shown again later ends the whole sign-in. */
	TokenResponse refresh(String token);

	/** Ends the sign-in the token belongs to. Unknown tokens are fine. */
	void logout(String token);

}
