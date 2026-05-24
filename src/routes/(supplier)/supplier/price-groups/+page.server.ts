import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';
import { parseFormData } from '$lib/utils/form';
import {
	priceGroupCreateSchema,
	priceGroupUpdateSchema,
	priceGroupDeleteSchema,
	setPricesGroupSchema
} from '$lib/schemas';

export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const [groups, products, existingPrices] = await Promise.all([
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
		}),
		db.select().from(schema.group_prices)
	]);

	const priceMap: Record<string, Record<string, number>> = {};
	for (const row of existingPrices) {
		if (!priceMap[row.price_group_id]) priceMap[row.price_group_id] = {};
		priceMap[row.price_group_id][row.product_id] = row.price;
	}

	return { groups, products, priceMap };
};

export const actions = {
	create: async ({ request, platform }) => {
		const form = parseFormData(await request.formData(), priceGroupCreateSchema);
		if (!form.ok) return form.fail;
		const { name, description } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		await db.insert(schema.price_groups).values({ name, description });
		return { success: true };
	},

	update: async ({ request, platform }) => {
		const form = parseFormData(await request.formData(), priceGroupUpdateSchema);
		if (!form.ok) return form.fail;
		const { id, name, description } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		await db
			.update(schema.price_groups)
			.set({ name, description, updated_at: now() })
			.where(eq(schema.price_groups.id, id));
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const form = parseFormData(await request.formData(), priceGroupDeleteSchema);
		if (!form.ok) return form.fail;

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.price_groups).where(eq(schema.price_groups.id, form.data.id));
		return { success: true };
	},

	setPrices: async ({ request, platform }) => {
		const formData = await request.formData();
		const form = parseFormData(formData, setPricesGroupSchema);
		if (!form.ok) return form.fail;
		const { group_id } = form.data;

		const db = drizzle(platform!.env.DB, { schema });

		await db.delete(schema.group_prices).where(eq(schema.group_prices.price_group_id, group_id));

		const entries: { price_group_id: string; product_id: string; price: number }[] = [];
		for (const [key, value] of formData.entries()) {
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
