package com.samsoft.bootifull.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class UserAccount {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Column(name = "password_hash")
	private String passwordHash;

	@Column(name = "display_name", nullable = false, length = 200)
	private String displayName;

	@Column(name = "avatar_url", length = 1000)
	private String avatarUrl;

	@Column(nullable = false)
	private boolean enabled = true;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected UserAccount() {
	}

	public UserAccount(UUID id, String email, String passwordHash, String displayName, String avatarUrl) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.displayName = displayName;
		this.avatarUrl = avatarUrl;
	}

	@PrePersist
	void prePersist() {
		Instant now = Instant.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() { return id; }
	public String getEmail() { return email; }
	public String getPasswordHash() { return passwordHash; }
	public String getDisplayName() { return displayName; }
	public String getAvatarUrl() { return avatarUrl; }
	public boolean isEnabled() { return enabled; }

	public void setDisplayName(String displayName) { this.displayName = displayName; }
	public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
	public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
