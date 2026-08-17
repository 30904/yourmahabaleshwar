# Setup Guide

## MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add database user and whitelist IP (`0.0.0.0/0` for dev)
3. Copy connection string to `backend/.env` as `MONGODB_URI`

## Integrations

Configure in `backend/.env` when ready:

- **Razorpay** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- **Fast2SMS** — `FAST2SMS_API_KEY`
- **MSG91** — `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`
- **SMTP** — `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- **WhatsApp** — `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`

## Production Build

```bash
cd frontend && npm run build
cd backend && npm start
```

Serve frontend `dist/` via Nginx or the included Docker setup.
