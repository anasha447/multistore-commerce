-- read every few seconds by every copy of the app
create index users_disabled_idx on users (updated_at) where not enabled;
