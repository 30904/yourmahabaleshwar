# Deploy — yourmahabaleshwar.com

Quick path for **https://www.yourmahabaleshwar.com**:

1. Fill `backend/.env` from `backend/.env.production.example`
2. `docker compose -f docker-compose.prod.yml up -d --build`
3. Install host TLS using `nginx-host.conf` + Certbot (see `docs/PRODUCTION.md`)
4. Register Razorpay webhook → `https://www.yourmahabaleshwar.com/api/webhooks/razorpay`

Files:

| File | Purpose |
|------|---------|
| `nginx-host.conf` | Apex→www + HTTPS reverse proxy to Docker `:8080` |
| `../frontend/nginx.conf` | In-container SPA + `/api` + `/uploads` proxy |
| `../docker-compose.prod.yml` | Mongo + API + web |
