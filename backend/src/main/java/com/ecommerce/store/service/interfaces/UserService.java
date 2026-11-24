package com.ecommerce.store.service.interfaces;

import java.util.function.Consumer;

import com.ecommerce.store.dto.request.ChangePasswordRequest;
import com.ecommerce.store.dto.request.UpdateProfileRequest;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.model.User;

/** The account of the caller. */
public interface UserService {

	/**
	 * Saves a new account.
	 * @param taken what to say when the email is known
	 * @param inSameTransaction what must happen with it or not at all
	 */
	User create(User user, String password, String taken, Consumer<User> inSameTransaction);

	UserResponse me(Long userId);

	UserResponse update(Long userId, UpdateProfileRequest request);

	/** Ends every sign-in of the account. */
	void changePassword(Long userId, ChangePasswordRequest request);

}
