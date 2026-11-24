create table users (
    id                   bigint primary key check (id between 1000000000000000 and 9007199254740991),
    email                varchar(255) not null,
    password_hash        varchar(100) not null,
    first_name           varchar(255) not null,
    last_name            varchar(255) not null,
    phone                varchar(50),
    enabled              boolean      not null,
    must_change_password boolean      not null,
    failed_logins        int          not null default 0 check (failed_logins >= 0),
    locked_until         timestamptz,
    created_at           timestamptz  not null,
    updated_at           timestamptz  not null
);
create unique index users_email_key on users (lower(email));
create index users_created_idx on users (created_at);

create table user_roles (
    user_id bigint      not null references users,
    role    varchar(20) not null check (role in ('ADMIN', 'MANAGER', 'CUSTOMER')),
    primary key (user_id, role)
);
create index user_roles_role_idx on user_roles (role);

-- only the SHA-256 of a token is stored
create table refresh_tokens (
    id         bigint primary key check (id between 1000000000000000 and 9007199254740991),
    user_id    bigint      not null references users,
    token_hash varchar(64) not null unique,
    family_id  varchar(36) not null,
    expires_at timestamptz not null,
    revoked    boolean     not null,
    rotated_at timestamptz,
    created_at timestamptz not null
);
create index refresh_tokens_family_idx on refresh_tokens (family_id);
create index refresh_tokens_user_idx on refresh_tokens (user_id);
create index refresh_tokens_expires_idx on refresh_tokens (expires_at);

create table addresses (
    id          bigint primary key check (id between 1000000000000000 and 9007199254740991),
    user_id     bigint       not null references users,
    line1       varchar(255) not null,
    line2       varchar(255),
    city        varchar(255) not null,
    state       varchar(255),
    postal_code varchar(50)  not null,
    country     varchar(255) not null,
    type        varchar(20)  not null check (type in ('HOME', 'WORK', 'OTHER')),
    is_default  boolean      not null,
    created_at  timestamptz  not null
);
create index addresses_user_idx on addresses (user_id, created_at);
create unique index addresses_one_default on addresses (user_id) where is_default;

grant select, insert, update, delete on users, user_roles, refresh_tokens, addresses to ${app_role};
