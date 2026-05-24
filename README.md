# Limerick — BtoB Wholesale Ordering Platform

A self-hosted B2B ordering portal for wholesale suppliers to manage retail buyer orders.
Built with SvelteKit + Cloudflare D1 + DrizzleORM. Part of the Alcogy OSS series alongside [Cork](../cork) (CRM) and [Galway](../galway) (WMS).

## Features

**Supplier (admin)**
- Product & category management with image upload (Cloudflare R2)
- Buyer (customer) management with email invitation flow
- Price group management — per-group contract prices or discount rates
- Order management — confirm, ship, complete, cancel with stock auto-restore on cancel
- Invoice generation — auto-aggregation by closing period, PDF print
- Email templates — customisable subject/body with variable substitution
- Audit log — all actions logged with user, IP, and metadata
- SKU auto-numbering

**Buyer (retailer)**
- Product catalog with contract prices, search, and sort
- Cart & checkout (stock auto-decrement)
- Order history with one-click reorder
- Invoice view & PDF print

**System**
- English / Japanese UI
- Light / Dark / System theme
- Session auth (PBKDF2 + HttpOnly cookie, 7-day session)
- Login rate-limiting with time-windowed attempt tracking
- Cloudflare Workers — deploy with `wrangler deploy`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / SSR | SvelteKit 2 (Svelte 5 runes) |
| Adapter | `@sveltejs/adapter-cloudflare` |
| ORM | DrizzleORM |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Auth | PBKDF2 via WebCrypto API |
| Email | Adapter pattern (Resend / SES / SMTP / Cloudflare Email) |
| Package manager | Bun |

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.1
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) ≥ 4 (`bun add -g wrangler`)
- A Cloudflare account with Workers and D1 enabled

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-org/limerick.git
cd limerick
bun install
```

### 2. Create Cloudflare resources

```bash
# D1 database
wrangler d1 create limerick-db
# → copy the database_id into wrangler.jsonc

# R2 bucket (for product images)
wrangler r2 bucket create limerick-storage
```

### 3. Configure wrangler.jsonc

Update the `database_id` in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "limerick-db",
    "database_id": "<your-database-id>",  // ← paste here
    "migrations_dir": "./drizzle"
  }
]
```

Set the email vars (see [Email configuration](#email-configuration)):

```jsonc
"vars": {
  "EMAIL_PROVIDER": "resend",        // "resend" | "ses" | "smtp"
  "EMAIL_FROM": "orders@example.com",
  "ALERT_EMAIL_TO": "admin@example.com",
  "SUPPLIER_NAME": "Acme Trading Co."
}
```

### 4. Apply database migrations

```bash
# Local development
bun run db:migrate:local

# Production (Cloudflare D1)
bun run db:migrate:remote
```

### 5. Create the first supplier account

Use the first-run wizard at `/setup` after starting the app, or insert manually:

```bash
# Seed an initial supplier (password set via invitation flow)
wrangler d1 execute limerick-db --local --command \
  "INSERT INTO users (id, email, name, role, is_active, password)
   VALUES (lower(hex(randomblob(16))), 'admin@example.com', 'Admin', 'supplier', 1, null)"
```

Then navigate to `/setup` to set a password.

### 6. Start development

```bash
bun run dev
# → http://localhost:5173
```

## Deployment

```bash
bun run build
wrangler deploy
```

## Email Configuration

Limerick supports four email providers. Set `EMAIL_PROVIDER` in `wrangler.jsonc` and the corresponding secret via `wrangler secret put`.

### Resend (recommended)

```jsonc
"vars": { "EMAIL_PROVIDER": "resend", "EMAIL_FROM": "orders@yourdomain.com" }
```

```bash
wrangler secret put RESEND_API_KEY
```

### AWS SES

```jsonc
"vars": { "EMAIL_PROVIDER": "ses", "EMAIL_FROM": "orders@yourdomain.com" }
```

```bash
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put AWS_REGION   # e.g. ap-northeast-1
```

### SMTP (HTTP relay)

```jsonc
"vars": { "EMAIL_PROVIDER": "smtp", "EMAIL_FROM": "orders@yourdomain.com" }
```

```bash
wrangler secret put SMTP_API_URL   # HTTP relay endpoint
wrangler secret put SMTP_API_KEY
```

### Cloudflare Email (admin alerts only)

Enable Cloudflare Email Routing on your domain. The `send_email` binding is already declared in `wrangler.jsonc` and is used automatically for admin alert emails when available.

### Email templates

Buyer invitation and order message templates are editable in the supplier UI at **Settings → Email Templates**. Variables use `{{variable_name}}` syntax.

| Template | Variables |
|---|---|
| Buyer Invitation | `buyer_name`, `company_name`, `supplier_name`, `setup_url`, `expires_at` |
| Order Message | `buyer_name`, `order_number` |

## Environment Variables

Declared in `wrangler.jsonc` under `vars` (non-secret) or set via `wrangler secret put` (secret).

| Variable | Type | Description |
|---|---|---|
| `EMAIL_PROVIDER` | var | `resend` \| `ses` \| `smtp` |
| `EMAIL_FROM` | var | Sender address (must be verified) |
| `ALERT_EMAIL_TO` | var | Fallback admin alert recipient |
| `SUPPLIER_NAME` | var | Displayed in invitation emails |
| `RESEND_API_KEY` | secret | Resend API key |
| `AWS_ACCESS_KEY_ID` | secret | AWS access key (SES) |
| `AWS_SECRET_ACCESS_KEY` | secret | AWS secret key (SES) |
| `AWS_REGION` | secret | AWS region, e.g. `ap-northeast-1` (SES) |
| `SMTP_API_URL` | secret | HTTP relay endpoint (SMTP mode) |
| `SMTP_API_KEY` | secret | HTTP relay API key (SMTP mode) |

Set a secret:

```bash
wrangler secret put RESEND_API_KEY
```

## Route Structure

```
/setup                      — first-run wizard (supplier account creation)
/login                      — public sign-in
/auth/setup-password        — buyer invitation activation (token-based)
/logout                     — sign out

/supplier/dashboard         — requires role=supplier
/supplier/products
/supplier/categories
/supplier/price-groups
/supplier/buyers
/supplier/orders
/supplier/orders/[id]       — order detail with status management
/supplier/invoices
/supplier/invoices/[id]
/supplier/profile
/supplier/audit-log
/supplier/email-templates
/supplier/settings

/buyer/catalog              — requires role=buyer
/buyer/cart
/buyer/orders
/buyer/orders/[id]
/buyer/invoices
/buyer/invoices/[id]
/buyer/profile
```

## Database Migrations

```bash
bun run db:generate          # generate new migration from schema changes
bun run db:migrate:local     # apply to local D1 (wrangler dev)
bun run db:migrate:remote    # apply to production D1
bun run db:studio            # open Drizzle Studio
```

## Development Commands

```bash
bun run dev          # start dev server
bun run build        # production build
bun run check        # TypeScript + Svelte checks
bun run lint         # ESLint + Prettier
bun run format       # auto-format
bun run test:unit    # Vitest unit tests
bun run test:e2e     # Playwright e2e tests
```

## License

MIT
