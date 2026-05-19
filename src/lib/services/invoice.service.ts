import { fail } from '@sveltejs/kit';
import { asc, count, desc, eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { writeAuditLog } from '$lib/server/audit';
import { now, todayISO } from '$lib/utils';
import type { ServiceCtx } from './index';
import type { InvoiceStatus } from '$lib/types';
import { INVOICE_NUMBER_DIGITS, INVOICE_NUMBER_PREFIX, PAGE_SIZE_LIST } from '$lib/constants';

export async function listInvoices(
	ctx: ServiceCtx,
	opts: { statusFilter: string; page: number }
) {
	const { db } = ctx;
	const { statusFilter, page } = opts;

	const where = statusFilter && statusFilter !== 'all'
		? eq(schema.invoices.status, statusFilter as InvoiceStatus)
		: undefined;

	const [[countResult], invoices, buyers] = await Promise.all([
		db.select({ count: count() }).from(schema.invoices).where(where),
		db.query.invoices.findMany({
			where,
			orderBy: [desc(schema.invoices.issued_at)],
			limit: PAGE_SIZE_LIST,
			offset: (page - 1) * PAGE_SIZE_LIST,
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
		totalPages: Math.ceil((countResult?.count ?? 0) / PAGE_SIZE_LIST),
		today: todayISO()
	};
}

export async function generateInvoice(
	ctx: ServiceCtx,
	input: { buyer_id: string; period_from: string; period_to: string; due_date: string }
) {
	const { db, env, user, request } = ctx;
	const { buyer_id, period_from, period_to, due_date } = input;

	if (!buyer_id || !period_from || !period_to || !due_date) {
		return fail(400, { error: 'All fields are required' });
	}

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
		return fail(400, { error: 'noOrders' });
	}

	const subtotal     = orders.reduce((s, o) => s + o.total_amount, 0);
	const tax_amount   = orders.reduce((s, o) => s + o.tax_amount, 0);
	const total_amount = subtotal + tax_amount;

	const year = new Date().getFullYear();
	const [[countRow]] = await Promise.all([
		db.select({ count: count() }).from(schema.invoices)
	]);
	const invoice_number = `${INVOICE_NUMBER_PREFIX}-${year}-${String((countRow?.count ?? 0) + 1).padStart(INVOICE_NUMBER_DIGITS, '0')}`;

	const ts = now();
	const [invoice] = await db.insert(schema.invoices).values({
		buyer_id, invoice_number, period_from, period_to, due_date,
		subtotal, tax_amount, total_amount, issued_at: ts
	}).returning();

	await db.insert(schema.invoice_orders).values(
		orders.map((o) => ({ invoice_id: invoice.id, order_id: o.id }))
	);

	await writeAuditLog({ db: env.DB, user_id: user?.id ?? null, action: 'create', resource_type: 'invoice', resource_id: invoice.id, metadata: { buyer_id, period_from, period_to }, request });
	return { success: true };
}

export async function markInvoicePaid(ctx: ServiceCtx, id: string) {
	const { db, env, user, request } = ctx;
	if (!id) return fail(400, { error: 'Invalid request' });

	const ts = now();
	await db.update(schema.invoices)
		.set({ status: 'paid', paid_at: ts, updated_at: ts })
		.where(eq(schema.invoices.id, id));

	await writeAuditLog({ db: env.DB, user_id: user?.id ?? null, action: 'update', resource_type: 'invoice', resource_id: id, metadata: { status: 'paid' }, request });
	return { success: true };
}

export async function getInvoiceWithSupplierInfo(
	ctx: ServiceCtx,
	invoiceId: string,
	buyerIdGuard?: string
) {
	const { db } = ctx;

	const whereClause = buyerIdGuard
		? and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.buyer_id, buyerIdGuard))
		: eq(schema.invoices.id, invoiceId);

	const [invoice, settingsRows] = await Promise.all([
		db.query.invoices.findFirst({
			where: whereClause,
			with: {
				buyer: { with: { user: true } },
				invoice_orders: { with: { order: { with: { items: true } } } }
			}
		}),
		db.select().from(schema.settings)
	]);

	if (!invoice) return null;

	const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
	return {
		invoice,
		supplier: {
			name:    s['company_name']    ?? '',
			address: s['company_address'] ?? '',
			zip:     s['company_zip']     ?? '',
			tel:     s['company_tel']     ?? '',
			taxNo:   s['company_tax_no']  ?? ''
		}
	};
}
