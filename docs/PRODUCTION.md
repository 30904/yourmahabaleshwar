# Production deployment — https://www.yourmahabaleshwar.com

Canonical site: **https://www.yourmahabaleshwar.com**  
Apex `https://yourmahabaleshwar.com` redirects to `www`.

Architecture (recommended): Cloudflare/DNS → host nginx (TLS) → Docker frontend `:8080` → proxies `/api` + `/uploads` → API + Mongo.

---

## 1. DNS

| Host | Type | Value |
|------|------|--------|
| `www` | A / AAAA | Your VPS IP |
| `@` (apex) | A / AAAA | Same IP (redirect handled in nginx) |

---

## 2. Prepare secrets on the server

```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```

Required before start:

- Strong `JWT_SECRET` + `JWT_REFRESH_SECRET` (different, ≥32 chars)
- `MONGODB_URI` (Atlas **or** leave Compose override to local Mongo)
- Razorpay **live** keys + webhook secret
- SMTP + SMS keys for real OTP

`CLIENT_URL` and `PUBLIC_API_URL` are already set for this domain in the template / Compose file.

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Razorpay webhook

URL:

`https://www.yourmahabaleshwar.com/api/webhooks/razorpay`

Events: `payment.captured`, `refund.processed`

---

## 4. Deploy app stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- App container HTTP: `127.0.0.1:8080`
- Health: `curl http://127.0.0.1:8080/healthz`

---

## 5. TLS (host nginx + Certbot)

```bash
sudo cp deploy/nginx-host.conf /etc/nginx/sites-available/yourmahabaleshwar
sudo ln -sf /etc/nginx/sites-available/yourmahabaleshwar /etc/nginx/sites-enabled/
# First obtain certs (HTTP-01), then enable the 443 blocks in that file
sudo certbot --nginx -d www.yourmahabaleshwar.com -d yourmahabaleshwar.com
sudo nginx -t && sudo systemctl reload nginx
```

If you terminate TLS at **Cloudflare** only, you can proxy Cloudflare → `:8080` with Full (strict) and still set `TRUST_PROXY=1`.

---

## 6. Smoke test on live domain

1. https://www.yourmahabaleshwar.com loads  
2. https://yourmahabaleshwar.com → 301 to www  
3. https://www.yourmahabaleshwar.com/healthz → `{ ok: true, env: "production" }`  
4. Admin login works  
5. Customer login OTP has **no** `devCode` in API JSON  
6. Booking + Razorpay live checkout  
7. Image/KYC upload via `/uploads/...`  

Seed **only** on empty staging/prod bootstrap:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run seed
```

---

## 7. Frontend build notes

Production Vite env (`frontend/.env.production`):

```
VITE_API_URL=/api
VITE_SITE_URL=https://www.yourmahabaleshwar.com
```

Same-origin `/api` avoids CORS issues when nginx proxies correctly.

---

## 8. Mobile

```
EXPO_PUBLIC_API_URL=https://www.yourmahabaleshwar.com/api
```

Rebuild Expo/EAS after changing this.
