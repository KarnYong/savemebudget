# Deploying SaveMe Budget to a Hostinger Ubuntu VPS

Target: **https://savemebudget.melivecode.com**

Stack on the server (all in Docker Compose):

| Service | Purpose | Exposed |
|---------|---------|---------|
| `caddy` | Reverse proxy + automatic HTTPS (Let's Encrypt) | 80, 443 |
| `app`   | Next.js standalone server; applies `db/schema.sql` on start | internal only |
| `db`    | PostgreSQL 18, data in the `pgdata` volume | **internal only (never published)** |

---

## 1. DNS

In the DNS panel for `melivecode.com` (Hostinger hPanel → Domains → DNS, or wherever the zone is hosted), add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A    | `savemebudget` | `<VPS IPv4>` | 300 |
| AAAA | `savemebudget` | `<VPS IPv6>` (only if the VPS has one) | 300 |

Check it resolves before continuing (Caddy needs it to issue the certificate):

```bash
dig +short savemebudget.melivecode.com
```

## 2. SSH and server preparation

```bash
ssh root@<VPS IP>

# Create a deploy user and give it your SSH key
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

From a new terminal, confirm `ssh deploy@<VPS IP>` works, then harden SSH (in `/etc/ssh/sshd_config` set `PasswordAuthentication no` and `PermitRootLogin no`) and `sudo systemctl restart ssh`.

Firewall: allow only SSH, HTTP and HTTPS.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

> Docker-published ports bypass ufw, which is why the `db` service deliberately has **no** `ports:` entry. Never add one in production. If Hostinger's panel firewall is enabled, open the same ports there.

Install Docker Engine + Compose plugin (official repository):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy   # log out and back in afterwards
docker compose version
```

## 3. Get the code onto the server

```bash
sudo mkdir -p /opt/savemebudget && sudo chown deploy:deploy /opt/savemebudget
git clone <your-git-remote-url> /opt/savemebudget
cd /opt/savemebudget
```

(No Git remote? From your machine: `rsync -av --exclude node_modules --exclude .next --exclude '.env*' ./ deploy@<VPS IP>:/opt/savemebudget/`.)

## 4. Environment variables

Create `/opt/savemebudget/.env` (read automatically by Docker Compose; ignored by Git and Docker builds):

```bash
cd /opt/savemebudget
cat > .env <<EOF
DOMAIN=savemebudget.melivecode.com
POSTGRES_USER=saveme
POSTGRES_PASSWORD=$(openssl rand -hex 32)
EOF
chmod 600 .env
```

| Variable | Used by | Notes |
|----------|---------|-------|
| `DOMAIN` | Caddy | Hostname for the certificate |
| `POSTGRES_USER` | db, app | Production-only user; **not** `root` |
| `POSTGRES_PASSWORD` | db, app | Strong random hex (URL-safe). **Never reuse the local `1234` password.** |
| `DATABASE_URL` | app | Built automatically in `docker-compose.yml` from the two values above |

Keep a copy of `.env` in your password manager. `POSTGRES_PASSWORD` is only applied when the `pgdata` volume is first created. To rotate it later, run `ALTER USER saveme PASSWORD '...'` inside the db container *and* update `.env`.

## 5. First deployment

```bash
cd /opt/savemebudget
docker compose up -d --build
docker compose ps
docker compose logs -f app     # expect "Schema applied to saveme_budget"
docker compose logs caddy | grep -i certificate
```

Open https://savemebudget.melivecode.com, sign up and add an expense.

Optional end-to-end check from your machine (creates two throwaway `smoke-*@example.test` accounts):

```bash
node scripts/smoke.mjs https://savemebudget.melivecode.com
```

## 6. Updates

```bash
cd /opt/savemebudget
./backup.sh                       # see below; always back up before updating
git pull
docker compose up -d --build      # rebuilds app; schema changes in db/schema.sql apply on start
docker image prune -f
```

`db/schema.sql` only uses `CREATE ... IF NOT EXISTS`, so re-running it never drops data.

## 7. Database backup and restore

### Backup

`backup.sh` (in the repo) writes a compressed dump to `backups/` and keeps 14 days.

```bash
chmod +x backup.sh   # if Git did not keep the executable bit
./backup.sh
# Daily at 03:00 (server time):
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/savemebudget/backup.sh >> /opt/savemebudget/backups/cron.log 2>&1") | crontab -
```

Copy backups off the server regularly, e.g. from your machine:
`rsync -av deploy@<VPS IP>:/opt/savemebudget/backups/ ./savemebudget-backups/`

### Restore

> Restoring **replaces** the current data. Take a fresh backup first.

```bash
cd /opt/savemebudget
source .env
./backup.sh                                  # safety copy of the current state
docker compose stop app
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d saveme_budget \
  --clean --if-exists --no-owner < backups/<file>.dump
docker compose start app
```

To test a backup without touching production data, restore it into a scratch database instead:

```bash
docker compose exec -T db createdb -U "$POSTGRES_USER" restore_test
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d restore_test --no-owner < backups/<file>.dump
docker compose exec -T db psql -U "$POSTGRES_USER" -d restore_test -c 'SELECT count(*) FROM expenses;'
```

## Troubleshooting

- **Certificate not issued:** DNS must point at the VPS, and ports 80/443 must be open in ufw and in Hostinger's firewall. Check with `docker compose logs caddy`.
- **App restarting:** `docker compose logs app`. Usually a wrong `POSTGRES_PASSWORD` after the volume was already created (see section 4).
- **psql shell:** `docker compose exec db psql -U saveme saveme_budget`
