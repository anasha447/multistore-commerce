package com.ecommerce.store.service.interfaces;

import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.request.UpdateProfileRequest;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.model.User;

/** Accounts. The only service that changes the users table. */
public interface UserService {

	/** A shopper. */
	User createCustomer(RegisterRequest request);

	/** A manager who must change the password; recorded in the audit. */
	User createStaff(CreateStaffRequest request);

	/** The first admin, from the settings; must change the password. */
	void createFirstAdmin(String email, String password);

	boolean adminExists();

	UserResponse me(Long userId);

	UserResponse update(Long userId, UpdateProfileRequest request);

	/** Locks the account until the transaction ends. Everything that ends or continues sign-ins starts here. */
	User lock(Long userId);

	/** The account must be locked. */
	void setEnabled(User user, boolean enabled);

	boolean passwordMatches(Long userId, String password);

	/** Refuses a common password. Slow on purpose: call it outside any transaction. */
	String hashNewPassword(String password);

	/** Inside the caller's transaction. The password no longer has to be changed. */
	void setPasswordHash(Long userId, String hash);

	/** The last allowed failure locks the account for a while. */
	void countFailedSignIn(String email);

	/** False when the account was locked, disabled or given a new password while the old one was checked. */
	boolean clearFailedSignIns(User user);

}
