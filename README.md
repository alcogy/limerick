# Limerick — BtoB Wholesale Ordering Platform

A self-hosted B2B ordering portal for wholesale suppliers to manage retail buyer orders.
Built with SvelteKit + Cloudflare D1 + DrizzleORM. Part of the Alcogy OSS series alongside [Cork](../cork) (CRM) and [Galway](../galway) (WMS).

## Features

**Supplier (admin)**
- Product & category management
- Buyer (customer) management with email invitation
- Price group management — per-group contract prices
- Order management — confirm, ship, complete, cancel, CSV export
- Invoice generation — auto-aggregation by closing period

**Buyer (retailer)**
- Product catalog with contract prices
- Cart & checkout
- Order history with re-order
- Invoice view

**System**
- English / Japanese UI switching
- Light / Dark / System theme
- Session auth (PBKDF2, HttpOnly cookie)
- Buyer invitation flow with one-time token
- Cloudflare Workers — deploy with `wrangler deploy`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / SSR | SvelteKit 2 (Svelte 5 runes) |
| Adapter | `@sveltejs/adapter-cloudflare` |
| ORM | DrizzleORM |
| Database | Cloudflare D1 (SQLite) |
| Auth | PBKDF2 via WebCrypto API |
| Icons | `@lucide/svelte` |

## Getting Started

### 1. Create Cloudflare resources

```bash
wrangler d1 create limerick-db
```

Copy the `database_id` into `wrangler.jsonc`.

### 2. Install dependencies

```bash
bun install
```

### 3. Apply database migrations

```bash
# Local dev
bun run db:generate
wrangler d1 migrations apply limerick-db --local

# Remote
wrangler d1 migrations apply limerick-db --remote
```

### 4. Create the first supplier account

Run a seed query locally:

```bash
# Generate a password hash first, then insert
wrangler d1 execute limerick-db --local --command \
  "INSERT INTO users (id, email, name, role, is_active) VALUES (lower(hex(randomblob(16))), 'admin@example.com', 'Admin', 'supplier', 1)"
```

Or use the password setup flow by temporarily making `/auth/setup-password` available without a token check.

### 5. Start development server

```bash
bun run dev
```

### 6. Deploy

```bash
bun run build
wrangler deploy
```

## Route Structure

```
/login                    — public sign-in page
/auth/setup-password      — buyer invitation activation
/logout                   — sign out

/supplier/dashboard       — requires role=supplier
/supplier/products
/supplier/categories
/supplier/price-groups
/supplier/buyers
/supplier/orders
/supplier/orders/export   — CSV download
/supplier/invoices

/buyer/catalog            — requires role=buyer
/buyer/cart
/buyer/orders
/buyer/invoices

/profile                  — both roles
```

## Database Migrations

```bash
bun run db:generate          # generate migration from schema changes
bun run db:migrate:local     # apply locally
bun run db:migrate:remote    # apply to remote D1
```

## Environment

No `.env` file needed for Cloudflare Workers. Bindings are declared in `wrangler.jsonc`.

For local development, `wrangler dev` injects D1 bindings automatically via `getPlatformProxy()`.
