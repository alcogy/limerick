import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const [groups, products] = await Promise.all([
		db
			.select({
				id: schema.price_groups.id,
				name: schema.price_groups.name,
				description: schema.price_groups.description,
				created_at: schema.price_groups.created_at,
				buyer_count: count(schema.buyers.id)
			})
			.from(schema.price_groups)
			.leftJoin(schema.buyers, eq(schema.buyers.price_group_id, schema.price_groups.id))
			.groupBy(schema.price_groups.id)
			.orderBy(asc(schema.price_groups.name)),
		db.query.products.findMany({
			where: eq(schema.products.is_active, true),
			orderBy: [asc(schema.products.name)],
			with: { category: true }
		})
	]);

	return { groups, products };
};

export const actions = {
	create: async ({ request, platform }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim() || null;

		if (!name) return fail(400, { error: 'Name is required' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.insert(schema.price_groups).values({ name, description });
		return { success: true };
	},

	update: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim() || null;

		if (!id || !name) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.update(schema.price_groups).set({ name, description, updated_at: now() })
			.where(eq(schema.price_groups.id, id));
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.price_groups).where(eq(schema.price_groups.id, id));
		return { success: true };
	},

	setPrices: async ({ request, platform }) => {
		const data = await request.formData();
		const group_id = data.get('group_id')?.toString();
		if (!group_id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });

		// Delete existing overrides for this group, then re-insert non-empty ones
		await db.delete(schema.group_prices)
			.where(eq(schema.group_prices.price_group_id, group_id));

		const entries: { price_group_id: string; product_id: string; price: number }[] = [];
		for (const [key, value] of data.entries()) {
			if (!key.startsWith('price_')) continue;
			const product_id = key.slice(6);
			const price = parseInt(value.toString());
			if (!isNaN(price) && price >= 0) {
				entries.push({ price_group_id: group_id, product_id, price });
			}
		}

		if (entries.length > 0) {
			await db.insert(schema.group_prices).values(entries);
		}

		return { success: true };
	}
} satisfies Actions;
