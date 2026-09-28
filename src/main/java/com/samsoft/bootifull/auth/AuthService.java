package com.samsoft.bootifull.auth;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService implements UserDetailsService {

	private final UserAccountRepository users;
	private final OAuthIdentityRepository identities;
	private final PasswordEncoder passwordEncoder;

	public AuthService(UserAccountRepository users, OAuthIdentityRepository identities, PasswordEncoder passwordEncoder) {
		this.users = users;
		this.identities = identities;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		return users.findByEmailIgnoreCase(normalizeEmail(username))
			.map(AppUserDetails::new)
			.orElseThrow(() -> new UsernameNotFoundException("User not found"));
	}

	@Transactional
	public UserAccount register(String email, String password, String displayName) {
		String normalizedEmail = normalizeEmail(email);
		if (users.existsByEmailIgnoreCase(normalizedEmail)) {
			throw new IllegalArgumentException("An account with this email already exists.");
		}
		String name = displayName == null || displayName.isBlank() ? normalizedEmail : displayName.trim();
		UserAccount user = new UserAccount(UUID.randomUUID(), normalizedEmail, passwordEncoder.encode(password), name, null);
		return users.save(user);
	}

	@Transactional
	public UserAccount upsertOAuthUser(String provider, String providerSubject, Map<String, Object> attributes) {
		return identities.findByProviderAndProviderSubject(provider, providerSubject)
			.map(identity -> {
				identity.setEmail(stringAttribute(attributes, "email"));
				return identity.getUser();
			})
			.orElseGet(() -> createOAuthUser(provider, providerSubject, attributes));
	}

	private UserAccount createOAuthUser(String provider, String providerSubject, Map<String, Object> attributes) {
		String email = normalizeEmail(stringAttribute(attributes, "email"));
		String displayName = stringAttribute(attributes, "name");
		String avatarUrl = stringAttribute(attributes, "picture");
		UserAccount user = users.findByEmailIgnoreCase(email)
			.orElseGet(() -> users.save(new UserAccount(UUID.randomUUID(), email, null,
				displayName == null || displayName.isBlank() ? email : displayName, avatarUrl)));
		user.setDisplayName(displayName == null || displayName.isBlank() ? user.getDisplayName() : displayName);
		user.setAvatarUrl(avatarUrl);
		identities.save(new OAuthIdentity(UUID.randomUUID(), user, provider, providerSubject, email));
		return user;
	}

	private static String normalizeEmail(String email) {
		if (email == null || email.isBlank()) {
			throw new IllegalArgumentException("Email is required.");
		}
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private static String stringAttribute(Map<String, Object> attributes, String key) {
		Object value = attributes.get(key);
		return value == null ? null : value.toString();
	}
}
