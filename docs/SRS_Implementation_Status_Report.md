<style>
  @page { size: A4; margin: 16mm 15mm 16mm 15mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.32;
    color: #1f2933;
  }
  h1 {
    font-size: 18pt;
    font-weight: 700;
    color: #003580;
    margin: 0 0 4pt;
    padding-bottom: 6pt;
    border-bottom: 2.5pt solid #003580;
  }
  h2 {
    font-size: 12pt;
    color: #003580;
    margin: 13pt 0 5pt;
    page-break-after: avoid;
  }
  p { margin: 0 0 7pt; }
  ul, ol { margin: 2pt 0 8pt 16pt; padding: 0; }
  li { margin: 0 0 2.5pt; }
  .meta {
    font-size: 9.5pt;
    color: #4b5563;
    margin: 0 0 10pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 6pt 0 10pt;
  }
  th, td {
    border: 0.6pt solid #c5cdd6;
    padding: 4.5pt 7pt;
    vertical-align: top;
    text-align: left;
  }
  th {
    background: #003580;
    color: #fff;
    font-weight: 600;
  }
  .note {
    font-size: 9.5pt;
    background: #f3f6fa;
    border-left: 3pt solid #003580;
    padding: 6pt 8pt;
    margin: 8pt 0 0;
  }
</style>

# SM Enterprises — Implementation Status

<p class="meta">
<strong>Project:</strong> yourmahabaleshwar.com &nbsp;|&nbsp;
<strong>Source:</strong> Software Requirements Specification (SRS) v1.0, 06 August 2026 &nbsp;|&nbsp;
<strong>Review date:</strong> 17 August 2026
</p>

This is a two-page summary of what is **working end-to-end today** versus what is **still remaining**, based on the SRS compared with the current website, admin dashboard, API, and Android (Expo) app.

**Done (E2E)** = demoable on website + API with seeded data. **Partial** = built but incomplete, mocked, or missing a surface. **Pending** = not implemented as specified.

<div class="note">
Payments, SMS, email, and WhatsApp work in development (mock if keys are missing). They are not production-live until Razorpay / SMS / SMTP / WhatsApp keys are configured. Android is a development app, not a Play Store release.
</div>

## 1. What is complete and working end-to-end

**Platforms:** Customer website (React PWA) and web admin dashboard (`/admin`) are live and usable.

**Customer (website):** registration, OTP login, profile, search, listing details, booking, online payment (Razorpay or mock), booking history, GST invoice PDF, cancel/refund request, wishlist, reviews, in-app notifications.

**Verticals live on web:** hotels, resorts, homestays, tents, guides, taxi, horse rides. Browse → detail → book → pay → invoice works.

**Vendor (website):** self-registration, admin-created vendors, KYC document upload, admin approve/reject, booking requests, accept/reject, wallet, subscriptions, point balance.

**Admin:** dashboard, users, vendors, bookings, payments, refunds, commissions, advertisements, subscriptions, marketing campaigns, CMS (banners, blogs, FAQs, settings), reports with Excel export, daily/weekly backup and restore.

**Business modules working on web + API:**

| Module | Working capability |
|---|---|
| Booking flow | Search, dates, availability, confirm, pay, vendor accept, invoice, complete |
| Payments | Razorpay order/verify; UPI, cards, net banking, wallets via gateway |
| GST invoices | Auto PDF with invoice no., parties, GST amount, download |
| Commission | Configurable %; stored per booking; payouts and wallet |
| Subscription + points | Monthly plans and point deduction on accept |
| Ads + marketing | Banners, featured listings, ad packages, bulk email/SMS/WhatsApp UI |
| Refunds | Configurable policy: full / partial / none, with status tracking |
| Reports | Bookings, revenue, GST, refunds, payments, subscriptions, ads, vendors, customers |
| Backups | Scheduled daily + weekly; database and media; restore |

**Ahead of the SRS:** strawberry, Mapro, and combo modules (listed as future scope) are already built on web + API.

**Security basics:** JWT + bcrypt, role-based access, admin audit logs, responsive PWA.

## 2. What is remaining

| Area | Status | Gap |
|---|---|---|
| Customer Android app | Partial | Expo app can browse, OTP, book, mock-pay. Not Play Store ready. No native Razorpay. |
| Vendor Android app | Partial | Same app: accept/reject, wallet, KYC text only. No listing CRUD or document photos. |
| English + Marathi | Partial | Language toggle exists. Most screens, admin, and CMS stay English. |
| Separate vendor dashboards | Pending | One shared vendor panel for all vendor types. |
| Vendor service & pricing management | Pending | Vendors cannot edit their own listings/prices; admin does this. |
| Availability calendar | Partial | Vendor must enter a listing ID and block dates. No real calendar. |
| Taxi vs driver (two modules) | Partial | One driver/taxi model plus enquiry forms, not two catalogs. |
| Resort packages / activities | Partial | Resorts reuse the hotel module. |
| Forgot password | Partial | Request page exists. No reset-password page or working email link. |
| OTP on every login | Partial | Customers/vendors yes. Admin/staff are password-only. |
| Live SMS / WhatsApp / email | Partial | Services exist; mock without production keys. |
| Coupons at checkout | Pending | Admin can create coupons; checkout does not apply them. |
| Search ad priority | Pending | Featured flag exists; search does not rank sponsored results first. |
| Vendor review inbox | Pending | Reviews are customer + admin moderation only. |
| Password / KYC / blogs polish | Partial | Mobile KYC is text-only. No public blog detail page. Legal pages are placeholders. |
| Production hardening | Partial | No CI/CD or APM. Field-level encryption of KYC docs not implemented. |

## 3. Suggested next work

**Website (do first)**

1. Vendor listing, pricing, and a proper availability calendar  
2. Password-reset page and email link  
3. Apply coupons at checkout  
4. Full Marathi on public, booking, and vendor screens  
5. Connect live Razorpay, SMS, email, and WhatsApp keys  
6. Vendor review inbox; blog detail and real legal content  

**Android (to match the SRS)**

1. EAS / Play Store build  
2. Native Razorpay checkout  
3. KYC document capture and notification inbox  
4. Vendor listing management on mobile  

**Later:** split taxi vs driver if still required; resort packages as their own data; sponsored search ranking; OTP for staff; monitoring and CI/CD.

---

<p class="meta" style="margin-top:12pt;">
<strong>Demo (after seed):</strong> Admin <code>admin@yourmahabaleshwar.com</code> / Admin@123 &nbsp;·&nbsp;
Customer <code>customer1@demo.com</code> / Customer@123 &nbsp;·&nbsp;
Hotel vendor <code>hotel.vendor@demo.com</code> / Vendor@123 (vendors/customers then enter OTP).
</p>
