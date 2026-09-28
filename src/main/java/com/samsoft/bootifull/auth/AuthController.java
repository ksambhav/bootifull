package com.samsoft.bootifull.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
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

	AuthController(AuthService authService, UserAccountRepository users) {
		this.authService = authService;
		this.users = users;
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
		return CurrentUserResponse.anonymous();
	}

	@ExceptionHandler(IllegalArgumentException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	ErrorResponse illegalArgument(IllegalArgumentException exception) {
		return new ErrorResponse(exception.getMessage());
	}

	record ErrorResponse(String message) {}
}
