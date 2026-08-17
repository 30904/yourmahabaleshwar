# YOURMAHABALESHWAR — Android (Phase 3)

Expo React Native app for **customer + vendor** (role-based tabs) against the existing Express API.

## Contract

See [`../docs/openapi-mobile-v1.yaml`](../docs/openapi-mobile-v1.yaml).

## Setup

```bash
cd mobile
npm install
```

Set API base URL (defaults to Android emulator → host machine):

- Emulator: `http://10.0.2.2:5000/api`
- Physical device: `http://<your-LAN-IP>:5000/api`

```bash
# optional
set EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
npm start
```

Then press `a` for Android emulator / Expo Go.

Backend must be running (`cd backend && npm run dev`) with seed data.

## Features

| Area | Status |
|------|--------|
| OTP login / register / vendor register | Done |
| Browse hotels, resorts, homestays, tents, guides, taxi, horses | Done |
| Create booking + mock Razorpay verify | Done |
| Bookings list, refund, invoice link | Done |
| Vendor accept/reject, wallet, KYC form | Done |
| EN / MR toggle | Done |
| Expo push token → `POST /users/devices` | Done |
| Live Razorpay native SDK | Needs `react-native-razorpay` + custom/dev build |
| FCM via Firebase Admin | Set `FIREBASE_SERVICE_ACCOUNT_JSON` on backend; Expo tokens work with Expo push |

## Demo accounts

Same as web seed:

- Customer: `customer1@demo.com` / `Customer@123` (+ OTP)
- Homestay vendor: `homestay@demo.com` / `Vendor@123` (+ OTP)

## Play Store path

1. Create EAS project: `npx eas init`
2. Add real `google-services.json` for FCM
3. `eas build -p android --profile production`
4. Wire live Razorpay + Firebase service account
