package com.samsoft.bootifull.auth;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.webauthn.api.PublicKeyCredentialUserEntity;
import org.springframework.security.web.webauthn.management.PublicKeyCredentialUserEntityRepository;
import org.springframework.security.web.webauthn.management.UserCredentialRepository;
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
	private final PublicKeyCredentialUserEntityRepository userEntities;
	private final UserCredentialRepository credentials;
	private final String googleClientId;
	private final String googleClientSecret;

	AuthController(AuthService authService, UserAccountRepository users, OAuthIdentityRepository identities,
		PublicKeyCredentialUserEntityRepository userEntities, UserCredentialRepository credentials,
		@Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId,
		@Value("${spring.security.oauth2.client.registration.google.client-secret:}") String googleClientSecret) {
		this.authService = authService;
		this.users = users;
		this.identities = identities;
		this.userEntities = userEntities;
		this.credentials = credentials;
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

	@GetMapping("/passkeys/registered")
	PasskeyRegisteredResponse passkeyRegistered(Authentication authentication) {
		return new PasskeyRegisteredResponse(isPasskeyRegistered(authentication));
	}

	private boolean isPasskeyRegistered(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
			return false;
		}
		return passkeyUsernames(authentication).stream()
			.map(userEntities::findByUsername)
			.filter(Objects::nonNull)
			.map(PublicKeyCredentialUserEntity::getId)
			.map(credentials::findByUserId)
			.anyMatch(registered -> !registered.isEmpty());
	}

	private List<String> passkeyUsernames(Authentication authentication) {
		Object principal = authentication.getPrincipal();
		if (principal instanceof PublicKeyCredentialUserEntity passkeyUser) {
			return List.of(resolveEmail(passkeyUser.getName()));
		}
		if (principal instanceof AppUserDetails appUser) {
			return List.of(appUser.getUsername());
		}
		if (principal instanceof OAuth2User oauth2User) {
			Object email = oauth2User.getAttributes().get("email");
			return email == null ? List.of() : List.of(resolveEmail(String.valueOf(email)));
		}
		return List.of();
	}

	private String resolveEmail(String username) {
		Optional<String> email = users.findByEmailIgnoreCase(username).map(UserAccount::getEmail);
		if (email.isPresent()) {
			return email.get();
		}
		return identities.findByProviderAndProviderSubject("google", username)
			.map(OAuthIdentity::getUser)
			.map(UserAccount::getEmail)
			.orElse(username);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	ErrorResponse illegalArgument(IllegalArgumentException exception) {
		return new ErrorResponse(exception.getMessage());
	}

	record ErrorResponse(String message) {}
}
