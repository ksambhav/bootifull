create table app_users
(
    id            uuid primary key,
    email         varchar(320) not null unique,
    password_hash varchar(255),
    display_name  varchar(200) not null,
    avatar_url    varchar(1000),
    enabled       boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table oauth_identities
(
    id               uuid primary key,
    user_id          uuid not null references app_users (id) on delete cascade,
    provider         varchar(100) not null,
    provider_subject varchar(255) not null,
    email            varchar(320),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    unique (provider, provider_subject)
);

create table user_entities
(
    id           varchar(1000) not null,
    name         varchar(100) not null,
    display_name varchar(200),
    primary key (id)
);

create table user_credentials
(
    credential_id                varchar(1000) not null,
    user_entity_user_id          varchar(1000) not null,
    public_key                   bytea not null,
    signature_count              bigint,
    uv_initialized               boolean,
    backup_eligible              boolean not null,
    authenticator_transports     varchar(1000),
    public_key_credential_type   varchar(100),
    backup_state                 boolean not null,
    attestation_object           bytea,
    attestation_client_data_json bytea,
    created                      timestamp,
    last_used                    timestamp,
    label                        varchar(1000) not null,
    primary key (credential_id)
);

create index idx_oauth_identities_user_id on oauth_identities (user_id);
create index idx_user_credentials_user_id on user_credentials (user_entity_user_id);
