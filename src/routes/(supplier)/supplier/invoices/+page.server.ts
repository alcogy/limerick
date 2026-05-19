import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { writeAuditLog } from '$lib/server/audit';
import { now, todayISO } from '$lib/utils';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const statusFilter = url.searchParams.get('status') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const PER_PAGE = 30;

	const where = statusFilter && statusFilter !== 'all'
		? eq(schema.invoices.status, statusFilter as 'issued' | 'paid' | 'overdue')
		: undefined;

	const [[countResult], invoices, buyers] = await Promise.all([
		db.select({ count: count() }).from(schema.invoices).where(where),
		db.query.invoices.findMany({
			where,
			orderBy: [desc(schema.invoices.issued_at)],
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
			with: { buyer: true }
		}),
		db.query.buyers.findMany({
			orderBy: [asc(schema.buyers.company_name)],
			with: { user: true }
		})
	]);

	return {
		invoices,
		buyers,
		total: countResult?.count ?? 0,
		page,
		totalPages: Math.ceil((countResult?.count ?? 0) / PER_PAGE),
		statusFilter,
		today: todayISO()
	};
};

export const actions = {
	generate: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const buyer_id = data.get('buyer_id')?.toString();
		const period_from = data.get('period_from')?.toString();
		const period_to = data.get('period_to')?.toString();
		const due_date = data.get('due_date')?.toString();

		if (!buyer_id || !period_from || !period_to || !due_date) {
			return fail(400, { error: 'All fields are required' });
		}

		const db = drizzle(platform!.env.DB, { schema });

		// Find completed orders in period
		const orders = await db.query.orders.findMany({
			where: and(
				eq(schema.orders.buyer_id, buyer_id),
				eq(schema.orders.status, 'completed'),
				gte(schema.orders.ordered_at, period_from),
				lte(schema.orders.ordered_at, period_to + ' 23:59:59')
			),
			with: { items: true }
		});

		if (orders.length === 0) {
			return fail(400, { error: 'No completed orders found in this period.' });
		}

		const subtotal = orders.reduce((s, o) => s + o.total_amount, 0);
		const tax_amount = orders.reduce((s, o) => s + o.tax_amount, 0);
		const total_amount = subtotal + tax_amount;

		// Generate invoice number
		const year = new Date().getFullYear();
		const [[countRow]] = await Promise.all([
			db.select({ count: count() }).from(schema.invoices)
		]);
		const invoice_number = `INV-${year}-${String((countRow?.count ?? 0) + 1).padStart(4, '0')}`;

		const ts = now();
		const [invoice] = await db.insert(schema.invoices).values({
			buyer_id, invoice_number, period_from, period_to, due_date,
			subtotal, tax_amount, total_amount, issued_at: ts
		}).returning();

		// Link orders to invoice
		await db.insert(schema.invoice_orders).values(
			orders.map((o) => ({ invoice_id: invoice.id, order_id: o.id }))
		);

		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'create', resource_type: 'invoice', resource_id: invoice.id, metadata: { buyer_id, period_from, period_to }, request });
		return { success: true };
	},

	markPaid: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.invoices)
			.set({ status: 'paid', paid_at: ts, updated_at: ts })
			.where(eq(schema.invoices.id, id));
		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'update', resource_type: 'invoice', resource_id: id, metadata: { status: 'paid' }, request });
		return { success: true };
	}
} satisfies Actions;
