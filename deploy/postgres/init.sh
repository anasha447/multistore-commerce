#!/bin/bash
# Runs once, as superuser, when the data directory is empty.
# For every store in STORES: a database, an owner (migrations), an app role and a backup role (read only).
# Passwords: <STORE>_OWNER_PASSWORD, <STORE>_APP_PASSWORD, <STORE>_BACKUP_PASSWORD.
set -euo pipefail

run() {
  psql -v ON_ERROR_STOP=1 --no-psqlrc --quiet --username "$POSTGRES_USER" "$@"
}

for store in $STORES; do
  if [[ ! $store =~ ^[a-z][a-z0-9_]{1,30}$ ]]; then
    echo "bad store id: $store" >&2
    exit 1
  fi
  prefix=${store^^}
  owner_var=${prefix}_OWNER_PASSWORD app_var=${prefix}_APP_PASSWORD backup_var=${prefix}_BACKUP_PASSWORD
  for name in "$owner_var" "$app_var" "$backup_var"; do
    if [[ -z ${!name:-} ]]; then
      echo "missing $name" >&2
      exit 1
    fi
  done

  run --dbname postgres \
    -v store="$store" -v owner="${store}_owner" -v app="${store}_app" -v backup="${store}_backup" \
    -v owner_pw="${!owner_var}" -v app_pw="${!app_var}" -v backup_pw="${!backup_var}" <<'SQL'
create role :"owner" login nosuperuser nocreatedb nocreaterole noinherit password :'owner_pw';
create role :"app" login nosuperuser nocreatedb nocreaterole noinherit password :'app_pw';
create role :"backup" login nosuperuser nocreatedb nocreaterole noinherit password :'backup_pw';
alter role :"app" set statement_timeout = '15s';
alter role :"app" set idle_in_transaction_session_timeout = '30s';
create database :"store" owner :"owner";
revoke all on database :"store" from public;
grant connect on database :"store" to :"owner", :"app", :"backup";
SQL

  run --dbname "$store" \
    -v owner="${store}_owner" -v app="${store}_app" -v backup="${store}_backup" <<'SQL'
revoke all on schema public from public;
create schema shop authorization :"owner";
grant usage on schema shop to :"app", :"backup";
alter default privileges for role :"owner" in schema shop grant select on tables to :"backup";
alter default privileges for role :"owner" in schema shop grant select on sequences to :"backup";
alter default privileges for role :"owner" revoke execute on functions from public;
SQL
done

# Nobody but the superuser needs the maintenance databases.
run --dbname postgres -c 'revoke connect on database postgres from public' -c 'revoke connect on database template1 from public'
