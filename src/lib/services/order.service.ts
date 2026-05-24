import { fail } from '@sveltejs/kit';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { writeAuditLog } from '$lib/server/audit';
import { now } from '$lib/utils';
import type { ServiceCtx } from './index';
import { requireSupplier } from './index';
import type { OrderStatus } from '$lib/types';
import { PAGE_SIZE_LIST } from '$lib/constants';

export async function listOrders(ctx: ServiceCtx, opts: { statusFilter: string; page: number }) {
	const { db } = ctx;
	const { statusFilter, page } = opts;

	const conditions =
		statusFilter && statusFilter !== 'all'
			? [eq(schema.orders.status, statusFilter as OrderStatus)]
			: [];
	const where = conditions.length ? and(...conditions) : undefined;

	const [[countResult], orders] = await Promise.all([
		db.select({ count: count() }).from(schema.orders).where(where),
		db.query.orders.findMany({
			where,
			orderBy: [desc(schema.orders.ordered_at)],
			limit: PAGE_SIZE_LIST,
			offset: (page - 1) * PAGE_SIZE_LIST,
			with: {
				buyer: true,
				items: { orderBy: (i, { asc }) => [asc(i.line_no)], with: { product: true } }
			}
		})
	]);

	return {
		orders,
		total: countResult?.count ?? 0,
		page,
		totalPages: Math.ceil((countResult?.count ?? 0) / PAGE_SIZE_LIST)
	};
}

export async function advanceOrderStatus(
	ctx: ServiceCtx,
	id: string,
	from: OrderStatus,
	to: OrderStatus,
	timestampField: 'confirmed_at' | 'shipped_at' | 'completed_at'
) {
	requireSupplier(ctx);
	const { db, env, user, request } = ctx;
	if (!id) return fail(400, { error: 'Invalid request' });

	const ts = now();
	await db
		.update(schema.orders)
		.set({ status: to, [timestampField]: ts, updated_at: ts })
		.where(and(eq(schema.orders.id, id), eq(schema.orders.status, from)));

	await writeAuditLog({
		db: env.DB,
		user_id: user?.id ?? null,
		action: 'update',
		resource_type: 'order',
		resource_id: id,
		metadata: { status: to },
		request
	});
	return { success: true };
}

export async function cancelOrder(ctx: ServiceCtx, id: string) {
	requireSupplier(ctx);
	const { db, env, user, request } = ctx;
	if (!id) return fail(400, { error: 'Invalid request' });

	const order = await db.query.orders.findFirst({
		where: eq(schema.orders.id, id),
		with: { items: true }
	});
	if (!order) return fail(404, { error: 'Order not found' });
	if (order.status === 'cancelled') return fail(400, { error: 'Already cancelled' });

	const stockDecremented = order.status !== 'pending';
	const ts = now();

	await db
		.update(schema.orders)
		.set({ status: 'cancelled', cancelled_at: ts, updated_at: ts })
		.where(eq(schema.orders.id, id));

	if (stockDecremented && order.items.length > 0) {
		await Promise.all(
			order.items.map((item) =>
				db
					.update(schema.products)
					.set({ stock_qty: sql`${schema.products.stock_qty} + ${item.quantity}` })
					.where(eq(schema.products.id, item.product_id))
			)
		);
	}

	await writeAuditLog({
		db: env.DB,
		user_id: user?.id ?? null,
		action: 'cancel',
		resource_type: 'order',
		resource_id: id,
		metadata: { previous_status: order.status },
		request
	});
	return { success: true };
}
