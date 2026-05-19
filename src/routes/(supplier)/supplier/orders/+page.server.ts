import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { writeAuditLog } from '$lib/server/audit';
import { now } from '$lib/utils';

const PER_PAGE = 30;

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const statusFilter = url.searchParams.get('status') || '';
	const search = url.searchParams.get('search') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const conditions = [];
	if (statusFilter && statusFilter !== 'all') {
		conditions.push(eq(schema.orders.status, statusFilter as typeof schema.orders.status.dataType));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [[countResult], orders] = await Promise.all([
		db.select({ count: count() }).from(schema.orders).where(where),
		db.query.orders.findMany({
			where,
			orderBy: [desc(schema.orders.ordered_at)],
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
			with: { buyer: true, items: { orderBy: (i, { asc }) => [asc(i.line_no)], with: { product: true } } }
		})
	]);

	return {
		orders,
		total: countResult?.count ?? 0,
		page,
		totalPages: Math.ceil((countResult?.count ?? 0) / PER_PAGE),
		statusFilter,
		search
	};
};

export const actions = {
	confirm: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'confirmed', confirmed_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'pending')));
		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'update', resource_type: 'order', resource_id: id, metadata: { status: 'confirmed' }, request });
		return { success: true };
	},

	ship: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'shipped', shipped_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'confirmed')));
		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'update', resource_type: 'order', resource_id: id, metadata: { status: 'shipped' }, request });
		return { success: true };
	},

	complete: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'completed', completed_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'shipped')));
		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'update', resource_type: 'order', resource_id: id, metadata: { status: 'completed' }, request });
		return { success: true };
	},

	cancel: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });

		// Pending orders have not yet decremented stock; confirmed/shipped/completed have
		const order = await db.query.orders.findFirst({
			where: eq(schema.orders.id, id),
			with: { items: true }
		});
		if (!order) return fail(404, { error: 'Order not found' });
		if (order.status === 'cancelled') return fail(400, { error: 'Already cancelled' });

		const stockDecremented = order.status !== 'pending';
		const ts = now();

		await db.update(schema.orders)
			.set({ status: 'cancelled', cancelled_at: ts, updated_at: ts })
			.where(eq(schema.orders.id, id));

		if (stockDecremented && order.items.length > 0) {
			await Promise.all(
				order.items.map((item) =>
					db.update(schema.products)
						.set({ stock_qty: sql`${schema.products.stock_qty} + ${item.quantity}` })
						.where(eq(schema.products.id, item.product_id))
				)
			);
		}

		await writeAuditLog({ db: platform!.env.DB, user_id: locals.user?.id ?? null, action: 'cancel', resource_type: 'order', resource_id: id, metadata: { previous_status: order.status }, request });
		return { success: true };
	}
} satisfies Actions;
