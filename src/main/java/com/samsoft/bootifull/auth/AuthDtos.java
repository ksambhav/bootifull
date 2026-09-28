package com.samsoft.bootifull.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record RegisterRequest(
	@NotBlank @Email String email,
	@NotBlank @Size(min = 8, max = 128) String password,
	@Size(max = 200) String displayName
) {}

record CurrentUserResponse(String email, String displayName, String avatarUrl, boolean authenticated) {
	static CurrentUserResponse anonymous() {
		return new CurrentUserResponse(null, null, null, false);
	}

	static CurrentUserResponse from(UserAccount user) {
		return new CurrentUserResponse(user.getEmail(), user.getDisplayName(), user.getAvatarUrl(), true);
	}
}

record AuthProvidersResponse(boolean password, boolean google, boolean passkey) {}

record PasskeyRegisteredResponse(boolean registered) {}
