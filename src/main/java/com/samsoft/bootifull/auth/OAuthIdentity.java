package com.samsoft.bootifull.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "oauth_identities", uniqueConstraints = @UniqueConstraint(columnNames = { "provider", "provider_subject" }))
public class OAuthIdentity {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private UserAccount user;

	@Column(nullable = false, length = 100)
	private String provider;

	@Column(name = "provider_subject", nullable = false, length = 255)
	private String providerSubject;

	@Column(length = 320)
	private String email;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected OAuthIdentity() {
	}

	public OAuthIdentity(UUID id, UserAccount user, String provider, String providerSubject, String email) {
		this.id = id;
		this.user = user;
		this.provider = provider;
		this.providerSubject = providerSubject;
		this.email = email;
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

	public UserAccount getUser() { return user; }
	public void setEmail(String email) { this.email = email; }
}
