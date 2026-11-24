-- Tables that belong to no shop feature. Each migration grants the app role exactly what its tables need;
-- nothing is granted by default.

-- Spring Modulith's event registry (its own layout, version 2)
create table event_publication (
    id                     uuid primary key,
    listener_id            text        not null,
    event_type             text        not null,
    serialized_event       text        not null,
    publication_date       timestamptz not null,
    completion_date        timestamptz,
    status                 text,
    completion_attempts    int,
    last_resubmission_date timestamptz
);
create index event_publication_serialized_event_hash_idx on event_publication using hash (serialized_event);
create index event_publication_by_completion_date_idx on event_publication (completion_date);

-- ShedLock
create table shedlock (
    name       varchar(64) primary key,
    lock_until timestamptz  not null,
    locked_at  timestamptz  not null,
    locked_by  varchar(255) not null
);

-- Staff changes, append-only (ADR-0012)
create table audit_entries (
    id          bigint generated always as identity primary key,
    at          timestamptz  not null default now(),
    actor_id    bigint,
    actor_roles varchar(100),
    action      varchar(100) not null,
    entity      varchar(100) not null,
    entity_id   varchar(64),
    before      jsonb,
    after       jsonb,
    client_ip   varchar(45),
    request_id  varchar(36)
);
create index audit_entries_entity_idx on audit_entries (entity, entity_id, at);
create index audit_entries_actor_idx on audit_entries (actor_id, at);

grant select, insert, update, delete on event_publication, shedlock to ${app_role};
grant select, insert on audit_entries to ${app_role};
