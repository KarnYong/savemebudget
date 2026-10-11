#!/usr/bin/env bash
# Usage (on the VPS): ./backup.sh  -> backups/saveme_budget-<timestamp>.dump, keeps 14 days.
set -euo pipefail
cd "$(dirname "$0")"
source .env
mkdir -p backups
file="backups/saveme_budget-$(date +%Y%m%d-%H%M%S).dump"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc saveme_budget > "$file"
find backups -name '*.dump' -mtime +14 -delete
echo "Backup written to $file"
