# Romi's Crafts storefront

India-only shop for handmade crafts: INR pricing, GST (CGST/SGST/IGST) invoices as PDF, made-to-order lead times, opt-in loyalty points, an owner admin, and a provider interface for payments and shipping. Next.js 16 on Vercel with Postgres.

## Run locally
```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD; SEED_DEMO=1 for sample products
npm run dev                  # no DATABASE_URL needed: uses an embedded Postgres stored in ./data/pglite
npm test                     # 38 tests, embedded Postgres in memory
```

## Deploy on Vercel
1. Storage > Create > **Neon Postgres** (adds `DATABASE_URL`). Storage > Create > **Blob** (adds `BLOB_READ_WRITE_TOKEN`, for product photos).
2. Settings > Environment Variables: `SESSION_SECRET` (`openssl rand -hex 32`), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ characters). Optional: `STORE_LEGAL_NAME`, `STORE_ADDRESS`, `STORE_GSTIN`, `STORE_EMAIL`, `SEED_DEMO=1`.
3. Redeploy. Tables are created on first request. Sign in at `/admin/login`; the owner account is created from the env values on first sign-in.
4. Settings > Deployment Protection: turn off Vercel Authentication for production so customers can see the shop.

## Before taking real orders
- Payments use a sandbox stub that is **disabled in production**. Implement a gateway (Razorpay, Cashfree...) in `lib/providers/payment.ts` and set `PAYMENT_PROVIDER`. Do not set `ALLOW_STUB_PAYMENTS=1` on a live shop: anyone could mark an order paid.
- Check GST rates, HSN codes, shipping settings and policy text in Admin > Shipping and GST.
- `/api/health` reports database connectivity.

## Notes
- Money is stored in paise. Stock is reserved at checkout and released after the hold expires. Payment confirmation is idempotent and issues one invoice per order, numbered per financial year.
- Image uploads need Vercel Blob when deployed; locally they go to `./data/uploads`.
