# PrintMyDoc

A Next.js + MySQL print-shop operations platform, inspired by [Print Catalyst](https://printcatalyst.in/)
with an independent UI (light theme by default, dark mode toggle in the sidebar). Covers merchant
onboarding, order intake, pricing/discounts, a local printer agent, WhatsApp (official API), a
Train Bot auto-reply system, employee accounts, referrals, withdrawals, a credits system, a shop
file library, and a super admin console.

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- MySQL 8 via `mysql2` (raw SQL, no ORM), tracked migrations in `scripts/migrations/`
- JWT auth (httpOnly cookies) — separate sessions for shops (`/login`) and super admins (`/admin/login`)
- Razorpay for payments (checkout, server-side signature verification, webhook)
- Meta WhatsApp Cloud API (official only — no unofficial QR/session pairing)
- A standalone local Node.js print agent (`agent/`) for real printers
- `nodemailer` for transactional email via super-admin-managed templates
- AES-256-GCM at-rest encryption for stored secrets (`src/lib/crypto.ts`)

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Razorpay keys, ENCRYPTION_KEY, etc.
npm run db:migrate           # creates the DB + runs all migrations
npm run db:seed              # demo shop, super admin, default email templates
npm run dev
```

**Shop login** (`/login`) — set via `SEED_SHOP_EMAIL` / `SEED_SHOP_PASSWORD`:
`rahulkumarsharmasharma6694@gmail.com` / `System@123`

**Super admin login** (`/admin/login`) — set via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`:
`admin@printmydoc.local` / `SuperAdmin@123`

Sample public order page: `/s/rahul-print-shop` · Merchant signup: `/register`

## What's built

### Merchant dashboard (`/dashboard`)
- **Dashboard** — revenue/order stats, weekly orders + monthly revenue charts, recent orders
- **Orders** — status-tabbed queue (Pending/Processing/Printing/Rejected/Print Failed/Done/All), search
- **Live Print** — real-time printer + queue telemetry from the local agent
- **WhatsApp Setup** — connect a number via Meta Cloud API, test-send a real message, webhook receiver
- **Train Bot** — configure greeting/document-received auto-replies and keyword Q&A pairs, with a
  live test chat that runs the exact same matching logic as the real WhatsApp webhook
- **Storage** — a real file library (categories, upload, download, delete) for shop documents
- **Credits** — per-period conversion credits, buy more via Razorpay
- **Withdraw** — request payout of order collections held by the platform's Razorpay account (UPI or bank)
- **Referrals** — referral code/link, wallet (locked/available/reserved/withdrawn/cancelled/reversed), withdraw
- **Employees** — add/disable staff accounts
- **Business Setup** — tabbed: Business Profile (capabilities + owner/login), Pricing (dynamic grid),
  Discounts (bulk-order + additional-copy), Printers (agent + credentials), Customer Portal
  (what customers can select), Automation & Payment (auto-print mode, Razorpay/manual payment, limits)
- **Shop QR** — QR code + link to the public order page
- **Billing** — the platform's own SaaS plans for the shop (₹100/₹250/₹500, order-count gated)

### Super admin (`/admin`)
- **Shops** — list every shop, suspend/reactivate
- **Withdrawal Requests** — approve/reject/mark-paid for both order-collection and referral payouts
  (manual settlement — no automatic bank transfers; see Payouts below)
- **Email Templates** — edit subject/HTML with `{{variable}}` placeholders for transactional emails

### Local print agent (`agent/`)
A small Node.js service the shop owner runs on their own PC. See `agent/README.md`. It:
- Detects printers already installed on that machine (CUPS `lpstat`/`lp` on macOS/Linux, or
  SumatraPDF on Windows) — **it does not install printer drivers**
- Reports them to the dashboard every 15s
- Polls for orders moved to "Printing" and sends them to the shop's default printer
- Verified working end-to-end against a real macOS printer during development

## Design decisions (confirmed with you before building)

- **Printers**: local Node.js agent talking to OS-installed printers, not driver installation
  (drivers aren't something a web app can install on someone else's machine).
- **WhatsApp**: official Meta Cloud API only. The "Quick Scan QR" personal-WhatsApp pairing style
  some competitors use violates WhatsApp's Terms of Service and risks the number being banned, so
  it isn't implemented. WhatsApp here is intake/notifications only — there's no conversational flow
  that turns a chat into a configured print order; customers still use the web order page.
- **Payouts**: manual, admin-approved. Withdrawal requests are tracked in the app; a super admin
  transfers money by UPI/bank outside the system and marks it paid. No payout API (e.g. RazorpayX)
  is wired up — that would need its own KYC/API setup.

## Payments

1. Get test keys from the [Razorpay dashboard](https://dashboard.razorpay.com/app/keys).
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`.
3. For webhook-based fulfillment (recommended for production), add a webhook in the Razorpay
   dashboard for `payment.captured` pointing to `POST /api/webhooks/razorpay`, and set
   `RAZORPAY_WEBHOOK_SECRET` to match.
4. Shops can also toggle "Use my own Razorpay account" (Business Setup → Automation & Payment) to
   settle directly instead of through the platform's shared account.

## WhatsApp

1. Create a Meta developer app with the WhatsApp product, get a phone number ID + access token.
2. Dashboard → WhatsApp Setup → paste them in; the app calls Meta's API immediately to verify they
   work before saving.
3. Add the webhook URL shown on that page to your Meta app config, with `WHATSAPP_VERIFY_TOKEN`
   matching your `.env.local`, subscribed to the `messages` field.

## Email

Set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` in `.env.local` to enable sending.
Without them, `sendTemplatedEmail` silently no-ops — nothing breaks, emails just don't send.

## Structure

- `src/app/dashboard/*` — shop owner dashboard
- `src/app/admin/*` — super admin console (separate auth realm, `pmd_admin_session` cookie)
- `src/app/s/[slug]` — public customer ordering page
- `src/app/register` — merchant self-signup (supports `?ref=CODE`)
- `src/app/api/*` — route handlers
- `src/lib/*` — shared server logic (pricing/discount engine, credits, subscriptions, finance,
  crypto, mailer, WhatsApp client, agent auth)
- `scripts/schema.sql` + `scripts/migrations/*.sql` — tracked DB migrations (`npm run db:migrate`)
- `agent/` — standalone local print agent
- `uploads/` — locally stored customer files (swap for S3/R2 before scaling past one server)

## Notes / production TODOs

- File uploads are stored on local disk under `uploads/<shopId>/`. Move to S3-compatible storage
  before deploying to more than one server instance.
- Page count is entered by the customer, not parsed from the PDF.
- Collage/merge special pricing has settings CRUD (Business Setup → Pricing) but no customer-facing
  multi-file ordering flow yet — that's a materially different upload UX.
- WhatsApp is intake/notification only, not a conversational ordering flow (see Design decisions).
# PrintMyDocNew
