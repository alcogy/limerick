## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: prettier, eslint, vitest, playwright, sveltekit-adapter, drizzle, mcp

---

## Product Overview

**Limerick** — BtoB Wholesale Ordering Platform.
A self-hosted ordering portal for wholesale suppliers (manufacturers) to manage retail buyer orders.
Built on Cloudflare Workers + D1 + SvelteKit. Deploy with `wrangler deploy`.

Design series: Cork (CRM) → Galway (inventory/WMS) → **Limerick (B2B ordering)**

---

## Implementation Tasks

- [x] 1. Install dependencies (`@lucide/svelte`, `sass-embedded`)
- [x] 2. DB schema — full schema per `docs/DATABASE.md`
- [x] 3. Wrangler & Drizzle config — D1 binding, drizzle.config.ts
- [x] 4. Global styles — `src/app.scss` with CSS variables, light/dark theme
- [x] 5. i18n — `src/lib/i18n/` (en.ts, ja.ts, lang.svelte.ts)
- [x] 6. Theme — `src/lib/theme.svelte.ts`
- [x] 7. Auth system — `src/lib/server/auth/index.ts` (PBKDF2, session)
- [x] 8. App types & server hooks — `src/app.d.ts`, `src/hooks.server.ts`
- [x] 9. Root layout — `src/routes/+layout.svelte`
- [x] 10. Login page — `src/routes/login/`
- [x] 11. Logout endpoint — `src/routes/logout/`
- [x] 12. Password setup — `src/routes/auth/setup-password/` (buyer invitation)
- [x] 13. Utility functions — `src/lib/utils/`
- [x] 14. Supplier layout — `src/routes/(supplier)/` (sidebar, auth guard)
- [x] 15. Supplier: Dashboard — `src/routes/(supplier)/supplier/dashboard/`
- [x] 16. Supplier: Categories — `src/routes/(supplier)/supplier/categories/`
- [x] 17. Supplier: Products — `src/routes/(supplier)/supplier/products/`
- [x] 18. Supplier: Price Groups — `src/routes/(supplier)/supplier/price-groups/`
- [x] 19. Supplier: Buyers — `src/routes/(supplier)/supplier/buyers/`
- [x] 20. Supplier: Orders — `src/routes/(supplier)/supplier/orders/`
- [x] 21. Supplier: Invoices — `src/routes/(supplier)/supplier/invoices/`
- [x] 22. Buyer layout — `src/routes/(buyer)/` (sidebar, auth guard)
- [x] 23. Buyer: Catalog — `src/routes/(buyer)/buyer/catalog/`
- [x] 24. Buyer: Cart & Checkout — `src/routes/(buyer)/buyer/cart/`
- [x] 25. Buyer: Orders — `src/routes/(buyer)/buyer/orders/`
- [x] 26. Buyer: Invoices — `src/routes/(buyer)/buyer/invoices/`
- [x] 27. README

## Phase 2 Tasks

- [x] 28. Price group existing values load — fetch current prices when opening pricing modal
- [x] 29. Order CSV line items — include order_items in export
- [x] 30. Stock auto-decrement — reduce stock_qty on order checkout
- [x] 31. Setup wizard — `/setup` route for first admin account creation
- [x] 32. Rate-based pricing — add `discount_rate` to buyers, fallback pricing logic
- [x] 33. Product sort order — `sort_order` column + catalog sort controls
- [x] 34. Product image upload — R2 binding, upload endpoint, catalog display
- [x] 35. Improved reorder — editable quantities before adding to cart
- [x] 36. Invoice PDF (Supplier) — print page at `/supplier/invoices/[id]`
- [x] 37. Invoice PDF (Buyer) — print page at `/buyer/invoices/[id]`

## Phase 3 Tasks (additional fixes & features completed)

- [x] 38. `order_items.line_no` — preserve line item order; `settings` table added
- [x] 39. SKU auto-numbering — `/supplier/settings` rules (prefix/digits/seq), `/api/sku` endpoint, Auto button in product form
- [x] 40. FOUC fixes — theme: inline script in `app.html`; language: cookie → server-side SSR rendering via `locals.locale`

---

## Session Summary (2026-05-20)

### What was built today

**Phase 5: Zod による入力バリデーション**

**追加パッケージ**
- `zod@4.4.3` を追加

**新規ファイル**
- `src/lib/utils/form.ts` — `parseFormData<T>(formData, schema)` ヘルパー。`{ ok: true, data }` / `{ ok: false, fail }` の判別ユニオンを返す
- `src/lib/schemas/auth.ts` — loginSchema, setupAccountSchema, setupPasswordSchema, changePasswordSchema, updateProfileSchema
- `src/lib/schemas/category.ts` — categoryCreateSchema, categoryUpdateSchema, categoryDeleteSchema
- `src/lib/schemas/price-group.ts` — priceGroupCreateSchema, priceGroupUpdateSchema, priceGroupDeleteSchema, setPricesGroupSchema
- `src/lib/schemas/product.ts` — productCreateSchema, productUpdateSchema, productDeleteSchema
- `src/lib/schemas/buyer.ts` — buyerCreateSchema, buyerUpdateSchema, buyerDeleteSchema, buyerInviteSchema
- `src/lib/schemas/settings.ts` — companyInfoSchema, catalogSettingsSchema, skuRulesSchema
- `src/lib/schemas/order.ts` — orderIdSchema, checkoutSchema（items JSON を内部で `z.array()` 検証）
- `src/lib/schemas/invoice.ts` — generateInvoiceSchema, invoiceIdSchema
- `src/lib/schemas/index.ts` — 全スキーマの re-export

**書き直したファイル（13ファイル）**
全 `+page.server.ts` の actions を `parseFormData` + スキーマに統一。手動の `data.get()` / `parseInt()` / `parseFloat()` を排除。

---

## Session Summary (2026-05-19)

### What was built today

**Phase 4: UX improvements, architecture, and security hardening**

**Architecture (DDD refactoring)**
- `src/lib/types/` — domain constants (OrderStatus, InvoiceStatus, etc.)
- `src/lib/services/` — business logic layer (order, invoice, buyer, product, settings services)
- `src/lib/constants.ts` — all magic numbers (PAGE_SIZE_LIST, PAGE_SIZE_CATALOG, INVITATION_EXPIRY_MS, INVOICE_NUMBER_*)
- All `+page.server.ts` files thinned to route handlers only

**Supplier features added/improved**
- Settings: company info (name, zip, address, tel, VAT/Tax No.), catalog image toggle (show/hide)
- Settings: section reorder (Appearance → Language → Company Info → SKU), postcode above address
- Settings: theme switcher moved from Sidebar to Settings page
- Orders: renamed to "受注管理", order detail page at `/supplier/orders/[id]` (PDF-printable)
- Invoices: PDF layout redesigned (supplier info top-right, buyer info bottom-left, period banner)
- Audit log viewer at `/supplier/audit-log`
- FileUploadDialog component integrated for product image upload

**Buyer features added/improved**
- Catalog: search (name/SKU), sort i18n, pagination (10/page, configurable in constants.ts)
- Catalog: "In cart: N" always visible, No image placeholder, image display toggle
- Cart: increment by 1 (not min_qty), "-" disabled at min_qty
- Reorder: uses current product prices (not order-time snapshot), price-change warning
- Orders: "注文書を印刷" button, order PDF at `/buyer/orders/[id]`
- Invoices: click row → direct navigation to `/buyer/invoices/[id]` (no modal)

**i18n / UX**
- All dates locale-aware: JA = YYYY年MM月DD日 (`formatDate`/`formatDateTime` in `$lib/i18n`)
- "Print / PDF" → "印刷 / PDF" (common.printPdf)
- Reorder, SearchBar, sort options, order/invoice labels fully translated

**DB migrations added**
- `0004` — audit_logs table
- `0005` — buyers.zip column
- `0006` — login_attempts table
- `0007` — sessions table (random token, replaces user.id as session key)

**Security hardening (9 items)**
1. Login rate limiting: 10 attempts / 15 min per email (login_attempts table)
2. R2 storage auth: require authenticated user for `/api/storage/[key]`
3. CSP header: `default-src 'self'` policy added to hooks
4. Session fixation fix: 256-bit random token in sessions table (not user.id)
5. HSTS: `Strict-Transport-Security` in production only
6. Invitation token entropy: UUID → `getRandomValues` (256-bit)
7. Role checks: `requireSupplier()` in all supplier service functions
8. Upload rate limit: 30 uploads/hour per user
9. Audit log UI: `/supplier/audit-log` with pagination

**Bug fixes**
- Safari login fix: `secure: !dev` for session cookie
- miniflare R2: `writeHttpMetadata` crash workaround
- FileUploadDialog: replaced `use:enhance` with direct `fetch` (works with `+server.ts` endpoints)
- `type="button"` on image upload/delete buttons inside forms
- `audit_logs` migration applied to local dev DB (was causing 500 errors)
- Pre-existing svelte-check errors fixed (ja.ts literal types, catalog orderBy)

### Known issues / not yet implemented

| Item | Notes |
|---|---|
| Email sending | Invitation URL shown in UI; no SMTP/Resend/SES adapter |
| Supplier multi-account | One supplier only; no per-account differentiation |
| Cron-based invoice generation | Manual only |
| Login attempt cleanup | Old login_attempts records accumulate; no scheduled purge |
| Session cleanup | Expired sessions accumulate; no scheduled purge |

### Next session candidates (OSS publication)

- [ ] README.md — setup guide, environment variables, deployment steps
- [ ] `.env.example` / `wrangler.jsonc` instructions for real `database_id`
- [ ] Remove/replace sample data seeding script
- [ ] License file
- [ ] GitHub Actions CI (type-check + lint)
- [ ] Consider: contributing guide, issue templates

---

## Session Summary (2026-05-18)

### What was built today

Full implementation of Limerick from scratch across 40 tasks:

**Foundation**: DB schema (11 tables), PBKDF2 auth, session cookies, i18n (EN/JA), light/dark/system theme, Cloudflare D1 + R2 bindings, DrizzleORM migrations, global SCSS design system.

**Supplier features**: Dashboard, Categories, Products (with image upload), Price Groups (absolute + rate-based pricing), Buyers (invite flow, discount_rate), Orders (status workflow, CSV export with line items), Invoices (generate, mark paid, PDF print).

**Buyer features**: Catalog (contract prices, sort/filter, images), Cart (localStorage, checkout with stock check), Orders (history, improved reorder modal), Invoices (list, PDF print).

**Cross-cutting**: Setup wizard (`/setup`), Profile pages, Settings (language switcher, SKU auto-numbering), FOUC prevention (theme + language).

### Known issues / not yet implemented

| Item | Notes |
|---|---|
| Email sending | Invitation URL is displayed in UI; no actual SMTP/Resend/SES adapter connected |
| Audit log | Operations are not logged (Cork/Galway have this) |
| Supplier multi-account | Only one supplier role; no per-account name differentiation |
| Invoice company info | Supplier's company name/address not shown on invoice PDF |
| Closing day auto-calculation | Invoice period_from/period_to are entered manually; no automation from `closing_day` |
| Cron-based invoice generation | Currently manual only |
| Stock restore on order cancel | Cancelling an order does not restore stock_qty |
| R2 local dev image serving | Images work in local dev via wrangler miniflare R2 |

### Next session candidates

- [ ] Email adapter implementation (Resend recommended)
- [ ] Audit log
- [ ] Stock restore on cancel
- [ ] Invoice PDF: add supplier company info (name, address) from settings
- [ ] Closing day auto-calculation helper in invoice generation
- [ ] Buyer invitation expiry display in buyers list
- [ ] Consider: `wrangler.jsonc` `database_id` swap for remote deployment docs

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend / SSR | SvelteKit (Cloudflare Pages adapter) |
| ORM | DrizzleORM |
| Database | Cloudflare D1 (SQLite) |
| Session | Cookie (256-bit token) → sessions table → D1 user |
| Email | Adapter pattern (Resend / SES / SMTP) |
| Deploy | Cloudflare Workers via Wrangler |

### User Roles

- **Supplier** — wholesaler/manufacturer, system administrator
- **Buyer** — retailer, invited by supplier

### Route Structure

```
/login                          — public
/auth/setup-password            — public (buyer invitation link)
/logout                         — public
/supplier/*                     — requires role=supplier
/buyer/*                        — requires role=buyer
```

---

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
