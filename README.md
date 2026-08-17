# YOURMAHABALESHWAR.COM

Production-ready PWA tourism marketplace for Mahabaleshwar — hotels, resorts, tents, guides, taxi, and driver enquiries.

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, JSX, Tailwind CSS, React Router, Axios, Context API, React Hook Form, Lucide, React Hot Toast, PWA |
| Backend | Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt, multer, Razorpay/SMS/Email structure |
| Database | MongoDB Atlas |

## Project Structure

```
project-root/
├── frontend/          # React PWA
├── backend/           # Express API
├── docs/              # Documentation
├── docker-compose.yml
└── README.md
```

## Roles

- `CUSTOMER` — Bookings, profile, wishlist
- `HOTEL_VENDOR` / `TENT_OPERATOR` / `GUIDE` / `DRIVER` — Vendor dashboards
- `OFFICE_STAFF_HOTEL` / `OFFICE_STAFF_GUIDE` — Office panels
- `SUPER_ADMIN` — Full admin panel

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas URI (or local MongoDB via Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run seed    # Seed hotels, tents, guides, drivers, users
npm run dev     # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # http://localhost:5173
```

### 3. Docker (optional)

```bash
docker-compose up -d
```

## Demo Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@yourmahabaleshwar.com | Admin@123 |
| Customer | customer1@demo.com | Customer@123 |
| Hotel Vendor | hotel.vendor@demo.com | Vendor@123 |

## API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login |
| `POST /api/auth/refresh` | Refresh token |
| `GET /api/hotels` | Hotels & resorts listing |
| `GET /api/tents` | Tents listing |
| `GET /api/guides` | Guides listing |
| `GET /api/drivers` | Taxi/drivers listing |
| `POST /api/bookings/*` | Create bookings (auth) |
| `POST /api/enquiries` | Lead capture |
| `POST /api/payments/*` | Razorpay structure |
| `GET /api/admin/*` | Admin & CMS |

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for Razorpay, Fast2SMS, MSG91, SMTP, and WhatsApp keys.

## PWA

- Installable on mobile/desktop
- Service worker via `vite-plugin-pwa`
- Offline shell caching
- Light theme only (Inter font)

## Verticals

1. Hotels & Resorts
2. Tents
3. Guides (6hr / 12hr + bike add-on)
4. Taxi (per trip / hourly)
5. Driver & hourly enquiries

## License

Proprietary — YOURMAHABALESHWAR.COM
