package com.samsoft.bootifull.auth;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.webauthn.management.JdbcPublicKeyCredentialUserEntityRepository;
import org.springframework.security.web.webauthn.management.JdbcUserCredentialRepository;

@Configuration
@EnableWebSecurity
class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(
		HttpSecurity http,
		AuthService authService,
		ObjectProvider<ClientRegistrationRepository> clients,
		@Value("${app.security.webauthn.rp-id:localhost}") String rpId,
		@Value("${app.security.webauthn.allowed-origins:http://localhost:8080,http://localhost:5173}") String allowedOrigins
	) throws Exception {
		http
			.csrf(AbstractHttpConfigurer::disable)
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/", "/index.html", "/assets/**", "/vite.svg", "/api/auth/register", "/api/auth/me", "/oauth2/**", "/login/oauth2/**", "/webauthn/authenticate/options", "/login/webauthn").permitAll()
				.anyRequest().authenticated()
			)
			.formLogin(form -> form
				.loginProcessingUrl("/api/auth/login")
				.usernameParameter("email")
				.successHandler(jsonSuccess())
				.failureHandler((request, response, exception) -> writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, "{\"message\":\"Invalid email or password\"}"))
			)
			.logout(logout -> logout
				.logoutUrl("/api/auth/logout")
				.logoutSuccessHandler(jsonLogout())
			)
			.webAuthn(webAuthn -> webAuthn
				.rpId(rpId)
				.allowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.toCollection(java.util.LinkedHashSet::new)))
			);

		if (clients.getIfAvailable() != null) {
			http.oauth2Login(oauth2 -> oauth2.successHandler((request, response, authentication) -> {
				OAuth2User principal = (OAuth2User) authentication.getPrincipal();
				authService.upsertOAuthUser("google", principal.getName(), principal.getAttributes());
				response.sendRedirect("/dashboard");
			}));
		}

		return http.build();
	}

	@Bean
	DaoAuthenticationProvider authenticationProvider(AuthService authService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(authService);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	JdbcPublicKeyCredentialUserEntityRepository jdbcPublicKeyCredentialUserEntityRepository(JdbcOperations jdbc) {
		return new JdbcPublicKeyCredentialUserEntityRepository(jdbc);
	}

	@Bean
	JdbcUserCredentialRepository jdbcUserCredentialRepository(JdbcOperations jdbc) {
		return new JdbcUserCredentialRepository(jdbc);
	}

	private static AuthenticationSuccessHandler jsonSuccess() {
		return (request, response, authentication) -> writeJson(response, HttpServletResponse.SC_OK, "{\"authenticated\":true}");
	}

	private static LogoutSuccessHandler jsonLogout() {
		return (request, response, authentication) -> writeJson(response, HttpServletResponse.SC_OK, "{\"authenticated\":false}");
	}

	private static void writeJson(HttpServletResponse response, int status, String body) throws IOException {
		response.setStatus(status);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(body);
	}
}
