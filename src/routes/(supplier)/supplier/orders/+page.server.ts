import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, count, desc, eq, like, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
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
			with: { buyer: true, items: { with: { product: true } } }
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
	confirm: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'confirmed', confirmed_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'pending')));
		return { success: true };
	},

	ship: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'shipped', shipped_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'confirmed')));
		return { success: true };
	},

	complete: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'completed', completed_at: ts, updated_at: ts })
			.where(and(eq(schema.orders.id, id), eq(schema.orders.status, 'shipped')));
		return { success: true };
	},

	cancel: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();
		await db.update(schema.orders).set({ status: 'cancelled', cancelled_at: ts, updated_at: ts })
			.where(eq(schema.orders.id, id));
		return { success: true };
	}
} satisfies Actions;
