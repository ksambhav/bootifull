package com.samsoft.bootifull.auth;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
class AuthController {

	private final AuthService authService;
	private final UserAccountRepository users;
	private final OAuthIdentityRepository identities;
	private final String googleClientId;
	private final String googleClientSecret;

	AuthController(AuthService authService, UserAccountRepository users, OAuthIdentityRepository identities,
		@Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId,
		@Value("${spring.security.oauth2.client.registration.google.client-secret:}") String googleClientSecret) {
		this.authService = authService;
		this.users = users;
		this.identities = identities;
		this.googleClientId = googleClientId;
		this.googleClientSecret = googleClientSecret;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	CurrentUserResponse register(@Valid @RequestBody RegisterRequest request) {
		return CurrentUserResponse.from(authService.register(request.email(), request.password(), request.displayName()));
	}

	@GetMapping("/me")
	CurrentUserResponse me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
			return CurrentUserResponse.anonymous();
		}
		Object principal = authentication.getPrincipal();
		if (principal instanceof AppUserDetails appUser) {
			return CurrentUserResponse.from(appUser.user());
		}
		if (principal instanceof OAuth2User oauth2User) {
			String email = String.valueOf(oauth2User.getAttributes().get("email"));
			return users.findByEmailIgnoreCase(email).map(CurrentUserResponse::from).orElse(CurrentUserResponse.anonymous());
		}
		if (principal instanceof PublicKeyCredentialUserEntity passkeyUser) {
			return resolvePasskeyUser(passkeyUser.getName());
		}
		return CurrentUserResponse.anonymous();
	}

	private CurrentUserResponse resolvePasskeyUser(String username) {
		return users.findByEmailIgnoreCase(username)
			.map(CurrentUserResponse::from)
			.or(() -> identities.findByProviderAndProviderSubject("google", username)
				.map(OAuthIdentity::getUser)
				.map(CurrentUserResponse::from))
			.orElse(CurrentUserResponse.anonymous());
	}

	@GetMapping("/providers")
	AuthProvidersResponse providers() {
		boolean google = StringUtils.hasText(googleClientId)
			&& !"bootifull-local-placeholder".equals(googleClientId)
			&& StringUtils.hasText(googleClientSecret);
		return new AuthProvidersResponse(true, google, true);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	ErrorResponse illegalArgument(IllegalArgumentException exception) {
		return new ErrorResponse(exception.getMessage());
	}

	record ErrorResponse(String message) {}
}
