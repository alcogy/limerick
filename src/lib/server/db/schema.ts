import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ─── Login Attempts ───────────────────────────────────────────────────────────

export const login_attempts = sqliteTable('login_attempts', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	identifier: text('identifier').notNull(), // email or IP
	attempted_at: text('attempted_at').notNull().default(sql`(datetime('now'))`)
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull().default('')
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	password: text('password'),
	role: text('role', { enum: ['supplier', 'buyer'] }).notNull(),
	name: text('name').notNull(),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(false),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Price Groups ─────────────────────────────────────────────────────────────

export const price_groups = sqliteTable('price_groups', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	description: text('description'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Buyers ───────────────────────────────────────────────────────────────────

export const buyers = sqliteTable('buyers', {
	id: text('id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	company_name: text('company_name').notNull(),
	phone: text('phone'),
	zip: text('zip'),
	address: text('address'),
	price_group_id: text('price_group_id').references(() => price_groups.id, {
		onDelete: 'set null'
	}),
	discount_rate: real('discount_rate'),  // e.g. 0.80 = 20% off base price (null = no discount)
	closing_day: integer('closing_day').notNull().default(20),
	payment_terms: text('payment_terms'),
	notes: text('notes'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Invitation Tokens ────────────────────────────────────────────────────────

export const invitation_tokens = sqliteTable('invitation_tokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	buyer_id: text('buyer_id')
		.notNull()
		.references(() => buyers.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expires_at: text('expires_at').notNull(),
	used_at: text('used_at')
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	sort_order: integer('sort_order').notNull().default(0),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = sqliteTable('products', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	category_id: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
	sku: text('sku').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	base_price: integer('base_price').notNull(),
	tax_rate: real('tax_rate').notNull().default(0.1),
	unit: text('unit').notNull().default('ea'),
	min_order_qty: integer('min_order_qty').notNull().default(1),
	stock_qty: integer('stock_qty').notNull().default(0),
	is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	sort_order: integer('sort_order').notNull().default(0),
	image_key: text('image_key'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Group Prices ─────────────────────────────────────────────────────────────

export const group_prices = sqliteTable(
	'group_prices',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		price_group_id: text('price_group_id')
			.notNull()
			.references(() => price_groups.id, { onDelete: 'cascade' }),
		product_id: text('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		price: integer('price').notNull(),
		created_at: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updated_at: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	}
);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = sqliteTable('orders', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	buyer_id: text('buyer_id')
		.notNull()
		.references(() => buyers.id, { onDelete: 'restrict' }),
	status: text('status', {
		enum: ['pending', 'confirmed', 'shipped', 'completed', 'cancelled']
	})
		.notNull()
		.default('pending'),
	total_amount: integer('total_amount').notNull(),
	tax_amount: integer('tax_amount').notNull(),
	notes: text('notes'),
	ordered_at: text('ordered_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	confirmed_at: text('confirmed_at'),
	shipped_at: text('shipped_at'),
	completed_at: text('completed_at'),
	cancelled_at: text('cancelled_at'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Order Items ──────────────────────────────────────────────────────────────

export const order_items = sqliteTable('order_items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	order_id: text('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	product_id: text('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'restrict' }),
	line_no: integer('line_no').notNull().default(0),
	sku: text('sku').notNull(),
	name: text('name').notNull(),
	unit_price: integer('unit_price').notNull(),
	tax_rate: real('tax_rate').notNull(),
	quantity: integer('quantity').notNull(),
	subtotal: integer('subtotal').notNull()
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = sqliteTable('invoices', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	buyer_id: text('buyer_id')
		.notNull()
		.references(() => buyers.id, { onDelete: 'restrict' }),
	invoice_number: text('invoice_number').notNull().unique(),
	period_from: text('period_from').notNull(),
	period_to: text('period_to').notNull(),
	due_date: text('due_date').notNull(),
	subtotal: integer('subtotal').notNull(),
	tax_amount: integer('tax_amount').notNull(),
	total_amount: integer('total_amount').notNull(),
	status: text('status', { enum: ['issued', 'paid', 'overdue'] })
		.notNull()
		.default('issued'),
	issued_at: text('issued_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	paid_at: text('paid_at'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Invoice Orders ───────────────────────────────────────────────────────────

export const invoice_orders = sqliteTable(
	'invoice_orders',
	{
		invoice_id: text('invoice_id')
			.notNull()
			.references(() => invoices.id, { onDelete: 'cascade' }),
		order_id: text('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'restrict' })
	},
	(t) => [primaryKey({ columns: [t.invoice_id, t.order_id] })]
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const audit_logs = sqliteTable('audit_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id').references(() => users.id, { onDelete: 'set null' }),
	action: text('action', {
		enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'cancel']
	}).notNull(),
	resource_type: text('resource_type').notNull(),
	resource_id: text('resource_id'),
	metadata: text('metadata'),
	ip_address: text('ip_address'),
	user_agent: text('user_agent'),
	created_at: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(users, ({ one }) => ({
	buyer: one(buyers, { fields: [users.id], references: [buyers.id] })
}));

export const buyerRelations = relations(buyers, ({ one, many }) => ({
	user: one(users, { fields: [buyers.id], references: [users.id] }),
	price_group: one(price_groups, {
		fields: [buyers.price_group_id],
		references: [price_groups.id]
	}),
	invitation_tokens: many(invitation_tokens),
	orders: many(orders),
	invoices: many(invoices)
}));

export const priceGroupRelations = relations(price_groups, ({ many }) => ({
	buyers: many(buyers),
	group_prices: many(group_prices)
}));

export const invitationTokenRelations = relations(invitation_tokens, ({ one }) => ({
	buyer: one(buyers, { fields: [invitation_tokens.buyer_id], references: [buyers.id] })
}));

export const categoryRelations = relations(categories, ({ many }) => ({
	products: many(products)
}));

export const productRelations = relations(products, ({ one, many }) => ({
	category: one(categories, { fields: [products.category_id], references: [categories.id] }),
	group_prices: many(group_prices),
	order_items: many(order_items)
}));

export const groupPriceRelations = relations(group_prices, ({ one }) => ({
	price_group: one(price_groups, {
		fields: [group_prices.price_group_id],
		references: [price_groups.id]
	}),
	product: one(products, { fields: [group_prices.product_id], references: [products.id] })
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
	buyer: one(buyers, { fields: [orders.buyer_id], references: [buyers.id] }),
	items: many(order_items),
	invoice_orders: many(invoice_orders)
}));

export const orderItemRelations = relations(order_items, ({ one }) => ({
	order: one(orders, { fields: [order_items.order_id], references: [orders.id] }),
	product: one(products, { fields: [order_items.product_id], references: [products.id] })
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
	buyer: one(buyers, { fields: [invoices.buyer_id], references: [buyers.id] }),
	invoice_orders: many(invoice_orders)
}));

export const invoiceOrderRelations = relations(invoice_orders, ({ one }) => ({
	invoice: one(invoices, { fields: [invoice_orders.invoice_id], references: [invoices.id] }),
	order: one(orders, { fields: [invoice_orders.order_id], references: [orders.id] })
}));
