#!/bin/sh
# Starts Redis with one user per store in STORES, allowed to touch only that store's keys.
# Passwords: <STORE>_REDIS_PASSWORD and REDIS_HEALTH_PASSWORD. Only their hashes are written down.
set -eu

hash() {
  [ -n "$1" ] || { echo "a Redis password is missing" >&2; exit 1; }
  printf %s "$1" | sha256sum | cut -d ' ' -f 1
}

acl=/tmp/users.acl
{
  echo "user default off"
  echo "user health on #$(hash "${REDIS_HEALTH_PASSWORD:-}") resetkeys resetchannels -@all +ping"
  for store in $STORES; do
    name=$(echo "$store" | tr 'a-z' 'A-Z')_REDIS_PASSWORD
    eval "password=\${$name:-}"
    echo "user $store on #$(hash "$password") resetkeys ~s:$store:* resetchannels -@all" \
      "+get +mget +set +del +unlink +incr +expire +pexpire +ttl +pttl +exists +eval +evalsha +script|load" \
      "+ping +hello +auth +client|setinfo +client|setname"
  done
} > "$acl"
chown redis "$acl"
chmod 400 "$acl"

exec docker-entrypoint.sh redis-server --aclfile "$acl" --maxmemory 96mb --maxmemory-policy volatile-lru \
  --save "" --appendonly no
