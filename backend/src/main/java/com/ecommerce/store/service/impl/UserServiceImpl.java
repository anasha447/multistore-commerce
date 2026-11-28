package com.ecommerce.store.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import com.ecommerce.store.config.CacheNames;
import com.ecommerce.store.dto.request.CreateStaffRequest;
import com.ecommerce.store.dto.request.RegisterRequest;
import com.ecommerce.store.dto.request.UpdateProfileRequest;
import com.ecommerce.store.dto.response.AdminUserResponse;
import com.ecommerce.store.dto.response.UserResponse;
import com.ecommerce.store.exception.ApiException;
import com.ecommerce.store.model.User;
import com.ecommerce.store.model.enums.Role;
import com.ecommerce.store.repository.UserRepository;
import com.ecommerce.store.security.PasswordPolicy;
import com.ecommerce.store.service.interfaces.AuditService;
import com.ecommerce.store.service.interfaces.UserService;

@Service
@RequiredArgsConstructor
class UserServiceImpl implements UserService {

	private static final int ALLOWED_FAILURES = 5;

	private static final Duration LOCK = Duration.ofMinutes(15);

	private final UserRepository users;

	private final PasswordEncoder passwordEncoder;

	private final PasswordPolicy passwordPolicy;

	private final AuditService audit;

	private final TransactionTemplate transaction;

	private final Clock clock;

	@Override
	public User createCustomer(RegisterRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.CUSTOMER))
			.build();
		return create(user, request.password(), "An account with this email already exists. Sign in instead.", false);
	}

	@Override
	public User createStaff(CreateStaffRequest request) {
		User user = User.builder()
			.email(request.email())
			.firstName(request.firstName())
			.lastName(request.lastName())
			.phone(request.phone())
			.roles(Set.of(Role.MANAGER))
			.mustChangePassword(true)
			.build();
		return create(user, request.password(), "An account with this email already exists.", true);
	}

	@Override
	public void createFirstAdmin(String email, String password) {
		User user = User.builder()
			.email(email)
			.firstName("Store")
			.lastName("Admin")
			.roles(Set.of(Role.ADMIN, Role.MANAGER))
			.mustChangePassword(true)
			.build();
		create(user, password, "An account with this email already exists.", false);
	}

	@Override
	@Transactional(readOnly = true)
	public boolean adminExists() {
		return users.existsByRolesContains(Role.ADMIN);
	}

	@Override
	@Cacheable(cacheNames = CacheNames.ME, key = "#userId", sync = true)
	@Transactional(readOnly = true)
	public UserResponse me(Long userId) {
		return UserResponse.from(find(userId));
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ME, key = "#userId")
	@Transactional
	public UserResponse update(Long userId, UpdateProfileRequest request) {
		User user = find(userId);
		user.setFirstName(request.firstName());
		user.setLastName(request.lastName());
		user.setPhone(request.phone());
		return UserResponse.from(user);
	}

	@Override
	@Transactional(propagation = Propagation.MANDATORY)
	public User lock(Long userId) {
		return users.findAndLock(userId).orElseThrow(UserServiceImpl::notFound);
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ME, key = "#user.id")
	@Transactional(propagation = Propagation.MANDATORY)
	public void setEnabled(User user, boolean enabled) {
		user.setEnabled(enabled);
	}

	@Override
	@Transactional(readOnly = true)
	public boolean passwordMatches(Long userId, String password) {
		return passwordEncoder.matches(password, find(userId).getPasswordHash());
	}

	@Override
	public String hashNewPassword(String password) {
		passwordPolicy.requireUncommon(password);
		return passwordEncoder.encode(password);
	}

	@Override
	@CacheEvict(cacheNames = CacheNames.ME, key = "#userId")
	@Transactional(propagation = Propagation.MANDATORY)
	public void setPasswordHash(Long userId, String hash) {
		User user = lock(userId);
		user.setPasswordHash(hash);
		user.setMustChangePassword(false);
	}

	@Override
	@Transactional
	public void countFailedSignIn(String email) {
		Instant now = clock.instant();
		users.countFailure(User.normaliseEmail(email), ALLOWED_FAILURES, now.plus(LOCK), now);
	}

	@Override
	@Transactional(propagation = Propagation.MANDATORY)
	public boolean clearFailedSignIns(User user) {
		return users.clearFailures(user.getId(), user.getPasswordHash(), clock.instant()) == 1;
	}

	/** Hashing is slow on purpose and happens before the transaction. */
	private User create(User user, String password, String taken, boolean audited) {
		user.setEmail(User.normaliseEmail(user.getEmail()));
		passwordPolicy.requireUncommon(password);
		if (users.existsByEmail(user.getEmail())) {
			throw ApiException.conflict(taken);
		}
		user.setPasswordHash(passwordEncoder.encode(password));
		try {
			return transaction.execute(status -> {
				User saved = users.saveAndFlush(user);
				if (audited) {
					audit.record("STAFF_CREATED", "user", saved.getId(), null, AdminUserResponse.from(saved));
				}
				return saved;
			});
		}
		catch (DataIntegrityViolationException ex) {
			throw users.existsByEmail(user.getEmail()) ? ApiException.conflict(taken) : ex;
		}
	}

	private User find(Long userId) {
		return users.findById(userId).orElseThrow(UserServiceImpl::notFound);
	}

	private static ApiException notFound() {
		return ApiException.notFound("Account not found.");
	}

}
