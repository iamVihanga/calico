#!/usr/bin/env bash
# Apply migrations + seed and run the pgTAP tests on a throwaway local Postgres 16, for machines
# where Docker / `supabase start` is unavailable. The real check is still `supabase test db`.
#
# Needs: postgresql-16, postgresql-16-pgtap, postgresql-16-cron (pg_net is stubbed).
# Usage: scripts/db-local.sh            # migrate, seed, test
#        KEEP=1 scripts/db-local.sh     # leave the server running (prints the psql command)
set -euo pipefail
cd "$(dirname "$0")/.."

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
PORT=${PGPORT:-54329}
DATA=$(mktemp -d /tmp/calico-pg.XXXXXX)
RUN_AS=()
if [ "$(id -u)" = 0 ]; then chown postgres "$DATA"; RUN_AS=(runuser -u postgres --); fi
pg() { "${RUN_AS[@]}" "$@"; }

pg "$PGBIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
pg "$PGBIN/pg_ctl" -D "$DATA" -l "$DATA/log" -w start \
  -o "-p $PORT -k /tmp -c shared_preload_libraries=pg_cron -c cron.database_name=calico -c timezone=UTC" >/dev/null
stop() { [ -n "${KEEP:-}" ] || pg "$PGBIN/pg_ctl" -D "$DATA" -m fast stop >/dev/null; }
trap stop EXIT

PSQL=(psql -h /tmp -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -d postgres -c "create database calico"
"${PSQL[@]}" -d postgres -c "alter database calico set search_path = \"\$user\", public, extensions"
"${PSQL[@]}" -d calico -f supabase/tests/local/supabase_shim.sql

for f in supabase/migrations/*.sql; do
  echo "migrate $(basename "$f")"
  # pg_net isn't packaged for plain Postgres; the shim provides a stub `net` schema instead.
  sed '/create extension if not exists pg_net/d' "$f" | "${PSQL[@]}" -d calico -f -
done
echo "seed"
"${PSQL[@]}" -d calico -f supabase/seed.sql

pg_prove -h /tmp -p "$PORT" -U postgres -d calico supabase/tests/*.test.sql

if [ -n "${KEEP:-}" ]; then echo "running: psql -h /tmp -p $PORT -U postgres calico   (data: $DATA)"; fi
