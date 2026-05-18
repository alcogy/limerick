# Limerick — DB設計

## 概要

Cloudflare D1（SQLite）を使用。DrizzleORMでスキーマ管理・マイグレーションを行う。

---

## テーブル一覧

### users

サプライヤー・バイヤー共通のユーザーテーブル。

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,          -- UUID
  email       TEXT NOT NULL UNIQUE,
  password    TEXT,                      -- bcryptハッシュ（招待前はNULL）
  role        TEXT NOT NULL,             -- 'supplier' | 'buyer'
  name        TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### buyers

バイヤー（得意先）の追加情報。

```sql
CREATE TABLE buyers (
  id              TEXT PRIMARY KEY,      -- UUID（users.idと同一）
  company_name    TEXT NOT NULL,
  phone           TEXT,
  address         TEXT,
  price_group_id  TEXT REFERENCES price_groups(id),
  closing_day     INTEGER NOT NULL DEFAULT 20,  -- 締日（1〜31）
  payment_terms   TEXT,                 -- 支払条件（例: "翌月末払い"）
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

### invitation_tokens

得意先招待用トークン。

```sql
CREATE TABLE invitation_tokens (
  id          TEXT PRIMARY KEY,          -- UUID
  buyer_id    TEXT NOT NULL REFERENCES buyers(id),
  token       TEXT NOT NULL UNIQUE,      -- crypto.randomUUID()
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);
```

### price_groups

得意先をグループ化して価格を管理する。

```sql
CREATE TABLE price_groups (
  id          TEXT PRIMARY KEY,          -- UUID
  name        TEXT NOT NULL,             -- 例: "一般卸価格" "特得意先"
  description TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### categories

商品カテゴリ。階層は持たない（フラット構造）。

```sql
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,          -- UUID
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
```

### products

商品マスタ。

```sql
CREATE TABLE products (
  id              TEXT PRIMARY KEY,      -- UUID
  category_id     TEXT REFERENCES categories(id),
  sku             TEXT NOT NULL UNIQUE,  -- 商品コード
  name            TEXT NOT NULL,
  description     TEXT,
  base_price      INTEGER NOT NULL,      -- 定価（円、税抜）
  tax_rate        REAL NOT NULL DEFAULT 0.10,
  unit            TEXT NOT NULL DEFAULT '個',
  min_order_qty   INTEGER NOT NULL DEFAULT 1,  -- 最低発注数
  stock_qty       INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  image_key       TEXT,                  -- R2のオブジェクトキー
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

### group_prices

価格グループごとの商品別契約価格。

```sql
CREATE TABLE group_prices (
  id              TEXT PRIMARY KEY,      -- UUID
  price_group_id  TEXT NOT NULL REFERENCES price_groups(id),
  product_id      TEXT NOT NULL REFERENCES products(id),
  price           INTEGER NOT NULL,      -- 契約価格（円、税抜）
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE(price_group_id, product_id)
);
```

### orders

受注ヘッダー。

```sql
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,      -- UUID
  buyer_id        TEXT NOT NULL REFERENCES buyers(id),
  status          TEXT NOT NULL DEFAULT 'pending',
                  -- pending | confirmed | shipped | completed | cancelled
  total_amount    INTEGER NOT NULL,      -- 税抜合計（円）
  tax_amount      INTEGER NOT NULL,      -- 消費税額（円）
  notes           TEXT,                  -- バイヤーからの備考
  ordered_at      TEXT NOT NULL,
  confirmed_at    TEXT,
  shipped_at      TEXT,
  completed_at    TEXT,
  cancelled_at    TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

### order_items

受注明細。

```sql
CREATE TABLE order_items (
  id          TEXT PRIMARY KEY,          -- UUID
  order_id    TEXT NOT NULL REFERENCES orders(id),
  product_id  TEXT NOT NULL REFERENCES products(id),
  sku         TEXT NOT NULL,             -- 受注時点のSKU（スナップショット）
  name        TEXT NOT NULL,             -- 受注時点の商品名（スナップショット）
  unit_price  INTEGER NOT NULL,          -- 受注時点の単価（税抜）
  tax_rate    REAL NOT NULL,             -- 受注時点の税率
  quantity    INTEGER NOT NULL,
  subtotal    INTEGER NOT NULL           -- unit_price * quantity
);
```

### invoices

請求書ヘッダー。締日単位で生成される。

```sql
CREATE TABLE invoices (
  id              TEXT PRIMARY KEY,      -- UUID
  buyer_id        TEXT NOT NULL REFERENCES buyers(id),
  invoice_number  TEXT NOT NULL UNIQUE,  -- 請求書番号（例: INV-2026-001）
  period_from     TEXT NOT NULL,         -- 集計期間 開始日
  period_to       TEXT NOT NULL,         -- 集計期間 終了日（締日）
  due_date        TEXT NOT NULL,         -- 支払期限
  subtotal        INTEGER NOT NULL,      -- 税抜合計
  tax_amount      INTEGER NOT NULL,      -- 消費税額
  total_amount    INTEGER NOT NULL,      -- 税込合計
  status          TEXT NOT NULL DEFAULT 'issued',
                  -- issued | paid | overdue
  issued_at       TEXT NOT NULL,
  paid_at         TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

### invoice_orders

請求書と受注の中間テーブル（1請求書に複数受注が含まれる）。

```sql
CREATE TABLE invoice_orders (
  invoice_id  TEXT NOT NULL REFERENCES invoices(id),
  order_id    TEXT NOT NULL REFERENCES orders(id),
  PRIMARY KEY (invoice_id, order_id)
);
```

---

## インデックス

```sql
CREATE INDEX idx_orders_buyer_id     ON orders(buyer_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_ordered_at   ON orders(ordered_at);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_invoices_buyer_id   ON invoices(buyer_id);
CREATE INDEX idx_invoices_status     ON invoices(status);
CREATE INDEX idx_group_prices_group  ON group_prices(price_group_id);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_active     ON products(is_active);
```

---

## 金額の扱い

- 全金額は**整数（円）で保存**（浮動小数点を使わない）
- 税率はREALで保存（例: 0.10）
- 表示時に税込み計算: `Math.floor(price * (1 + tax_rate))`
- 消費税の端数処理: 切り捨て（order_itemsの合計時）

---

## DrizzleORMスキーマ例

```typescript
// src/lib/server/db/schema.ts
import { sqliteTable, text, integer, real, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull().unique(),
  password:  text('password'),
  role:      text('role', { enum: ['supplier', 'buyer'] }).notNull(),
  name:      text('name').notNull(),
  isActive:  integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const products = sqliteTable('products', {
  id:           text('id').primaryKey(),
  categoryId:   text('category_id').references(() => categories.id),
  sku:          text('sku').notNull().unique(),
  name:         text('name').notNull(),
  description:  text('description'),
  basePrice:    integer('base_price').notNull(),
  taxRate:      real('tax_rate').notNull().default(0.10),
  unit:         text('unit').notNull().default('個'),
  minOrderQty:  integer('min_order_qty').notNull().default(1),
  stockQty:     integer('stock_qty').notNull().default(0),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  imageKey:     text('image_key'),
  createdAt:    text('created_at').notNull(),
  updatedAt:    text('updated_at').notNull(),
})

// 以下同様に定義...
```
