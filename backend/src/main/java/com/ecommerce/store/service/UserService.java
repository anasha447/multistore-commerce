package com.ecommerce.store.service;

import java.util.function.Consumer;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.ecommerce.store.dto.request.ChangePasswordRequest;
import com.ecommerce.store.dto.request.UpdateProfileRequest;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.repository.RefreshTokenRepository;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.PasswordPolicy;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository users;

	private final RefreshTokenRepository refreshTokens;

	private final PasswordEncoder passwordEncoder;

	private final PasswordPolicy passwordPolicy;

	private final TransactionTemplate transaction;

	/** Hashing is slow on purpose and happens outside any transaction. */
	public User create(User user, String password, String taken, Consumer<User> inSameTransaction) {
		passwordPolicy.requireUncommon(password);
		user.setEmail(User.normaliseEmail(user.getEmail()));
		if (users.existsByEmail(user.getEmail())) {
			throw ApiException.conflict(taken);
		}
		user.setPasswordHash(passwordEncoder.encode(password));
		try {
			return transaction.execute(status -> {
				User saved = users.saveAndFlush(user);
				inSameTransaction.accept(saved);
				return saved;
			});
		}
		catch (DataIntegrityViolationException ex) {
			throw users.existsByEmail(user.getEmail()) ? ApiException.conflict(taken) : ex;
		}
	}

	@Transactional(readOnly = true)
	public UserResponse me(Long userId) {
		return UserResponse.from(find(userId));
	}

	@Transactional
	public UserResponse update(Long userId, UpdateProfileRequest request) {
		User user = find(userId);
		user.setFirstName(request.firstName());
		user.setLastName(request.lastName());
		user.setPhone(request.phone());
		return UserResponse.from(user);
	}

	/** Ends every sign-in of the account. Hashing happens outside the transaction. */
	public void changePassword(Long userId, ChangePasswordRequest request) {
		if (!passwordEncoder.matches(request.currentPassword(), find(userId).getPasswordHash())) {
			throw ApiException.badRequest("Current password is incorrect");
		}
		passwordPolicy.requireUncommon(request.newPassword());
		String hash = passwordEncoder.encode(request.newPassword());
		transaction.executeWithoutResult(status -> {
			User user = users.findAndLock(userId).orElseThrow();
			user.setPasswordHash(hash);
			user.setMustChangePassword(false);
			refreshTokens.revokeAll(userId);
		});
	}

	private User find(Long userId) {
		return users.findById(userId).orElseThrow(() -> ApiException.notFound("Account not found."));
	}

}
