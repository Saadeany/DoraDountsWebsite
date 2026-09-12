# Deploying Felt & Form to a VPS with Docker

## File placement

Copy these into your repo (paths matter — the compose file assumes them):

```
felt-and-form/
├── docker-compose.yml          ← repo root
├── .env                        ← repo root (from .env.example)
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env                    ← from .env.production.example
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── .dockerignore
```

Also apply `backend/server.js.patched` → replace your `backend/server.js` with
it (it's identical to your current file plus one line: `app.set("trust proxy", 1)`,
needed because the app now sits behind nginx — see SECURITY_AUDIT.md).

## Prerequisites on the VPS

- Docker Engine + the Compose plugin (`docker compose version` should work)
- A domain pointed at the VPS's IP (A record)
- Ports 80/443 open in the firewall (`ufw allow 80,443/tcp` or your provider's rules)
- SSH access with a non-root sudo user (don't deploy as root)

## Steps

1. **Clone the repo onto the VPS**
   ```bash
   git clone <your-repo-url> felt-and-form
   cd felt-and-form
   ```

2. **Configure environment files**
   ```bash
   cp .env.example .env
   cp backend/.env.production.example backend/.env
   ```
   Edit both. At minimum:
   - `JWT_SECRET` — generate with `openssl rand -hex 64`
   - `DB_PASSWORD` / `DB_ROOT_PASSWORD` — generate with `openssl rand -base64 32`, must match between root `.env` and `backend/.env`
   - `CLIENT_URL` — your real domain, `https://...`, no trailing slash
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — real values, not the repo defaults
   - SMTP credentials

3. **Apply the server.js patch** (adds `trust proxy`, required behind nginx)
   ```bash
   cp backend/server.js.patched backend/server.js
   ```

4. **Build and start**
   ```bash
   docker compose build
   docker compose up -d
   5. Check their status
      docker compose ps
   docker compose logs -f backend   # watch for "MySQL ... connected" and "API running"
   ```

5. **Initialize the database** (fresh install only — this drops all tables)
   ```bash
   docker compose exec backend node seed.js
   ```
   Read the seed-data warning in SECURITY_AUDIT.md first — it creates a demo
   customer account with a fixed, publicly-known password.

6. **Put TLS in front of it.** The frontend container only listens on
   `127.0.0.1:8080` (see docker-compose.yml) — nothing is reachable from the
   internet until you add a reverse proxy. Two straightforward options:

   **Option A — host nginx + certbot**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```
   Host nginx config (`/etc/nginx/sites-available/feltandform`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Then:
   ```bash
   sudo ln -s /etc/nginx/sites-available/feltandform /etc/nginx/sites-enabled/
   sudo certbot --nginx -d yourdomain.com
   ```
   Certbot rewrites the config for HTTPS and sets up auto-renewal. Once
   confirmed working, add `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;`
   to the host nginx server block.

   **Option B — Caddy** (simpler, automatic HTTPS, no certbot cron needed)
   Add a `caddy` service to docker-compose.yml instead of publishing the
   frontend port directly:
   ```yaml
   caddy:
     image: caddy:2-alpine
     restart: unless-stopped
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./Caddyfile:/etc/caddy/Caddyfile
       - caddy_data:/data
     networks:
       - internal
   ```
   `Caddyfile`:
   ```
   yourdomain.com {
       reverse_proxy frontend:80
   }
   ```
   Add `caddy_data:` to the `volumes:` block. Caddy gets and renews the
   certificate automatically — no certbot needed.

7. **Verify**
   - `https://yourdomain.com` loads the storefront
   - `https://yourdomain.com/api/health` returns `{"status":"ok",...}`
   - `docker compose ps` shows all services healthy
   - Log in as admin, immediately change the seeded admin password if you ran seed with a temporary one

## Ongoing operations

- **Logs**: `docker compose logs -f backend` / `frontend` / `mysql`
- **Backups**: `docker compose exec mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" felt_and_form > backup-$(date +%F).sql` — automate this with a cron job, and copy backups off the VPS
- **Updates**: `git pull && docker compose build && docker compose up -d`
- **Uploaded images** live in the `backend_uploads` named volume — back this up too (`docker run --rm -v felt-and-form_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .`)
- **Image updates**: periodically rebuild (`docker compose build --pull`) so `node:20-alpine`, `mysql:8.0`, and `nginx:1.27-alpine` pick up upstream security patches


## cloudflare phone test
**powershell**
   cloudflared tunnel --url http://localhost:80