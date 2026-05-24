import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { parseFormData } from '$lib/utils/form';
import { categoryCreateSchema, categoryUpdateSchema, categoryDeleteSchema } from '$lib/schemas';

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
		const form = parseFormData(await request.formData(), categoryCreateSchema);
		if (!form.ok) return form.fail;
		const { name, sort_order } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		await db.insert(schema.categories).values({ name, sort_order });
		return { success: true };
	},

	update: async ({ request, platform }) => {
		const form = parseFormData(await request.formData(), categoryUpdateSchema);
		if (!form.ok) return form.fail;
		const { id, name, sort_order } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		await db
			.update(schema.categories)
			.set({ name, sort_order })
			.where(eq(schema.categories.id, id));
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const form = parseFormData(await request.formData(), categoryDeleteSchema);
		if (!form.ok) return form.fail;

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.categories).where(eq(schema.categories.id, form.data.id));
		return { success: true };
	}
} satisfies Actions;
