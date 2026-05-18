import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const rows = await db
		.select({
			id: schema.categories.id,
			name: schema.categories.name,
			sort_order: schema.categories.sort_order,
			created_at: schema.categories.created_at,
			product_count: count(schema.products.id)
		})
		.from(schema.categories)
		.leftJoin(schema.products, eq(schema.products.category_id, schema.categories.id))
		.groupBy(schema.categories.id)
		.orderBy(asc(schema.categories.sort_order), asc(schema.categories.name));

	return { categories: rows };
};

export const actions = {
	create: async ({ request, platform }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const sort_order = parseInt(data.get('sort_order')?.toString() ?? '0') || 0;

		if (!name) return fail(400, { error: 'Name is required' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.insert(schema.categories).values({ name, sort_order });
		return { success: true };
	},

	update: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const sort_order = parseInt(data.get('sort_order')?.toString() ?? '0') || 0;

		if (!id || !name) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.update(schema.categories).set({ name, sort_order }).where(eq(schema.categories.id, id));
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.categories).where(eq(schema.categories.id, id));
		return { success: true };
	}
} satisfies Actions;
