import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, count, desc, eq, like, and, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

const PER_PAGE = 30;

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const search = url.searchParams.get('search') || '';
	const categoryFilter = url.searchParams.get('category') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const conditions = [];
	if (search) {
		conditions.push(
			or(
				like(schema.products.name, `%${search}%`),
				like(schema.products.sku, `%${search}%`)
			)
		);
	}
	if (categoryFilter) {
		conditions.push(eq(schema.products.category_id, categoryFilter));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [[countResult], products, categories] = await Promise.all([
		db.select({ count: count() }).from(schema.products).where(where),
		db.query.products.findMany({
			where,
			orderBy: [desc(schema.products.created_at)],
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
			with: { category: true }
		}),
		db.select().from(schema.categories).orderBy(asc(schema.categories.sort_order))
	]);

	return {
		products,
		categories,
		total: countResult?.count ?? 0,
		page,
		totalPages: Math.ceil((countResult?.count ?? 0) / PER_PAGE),
		search,
		categoryFilter
	};
};

export const actions = {
	create: async ({ request, platform }) => {
		const data = await request.formData();
		const sku = data.get('sku')?.toString().trim();
		const name = data.get('name')?.toString().trim();
		const base_price = parseInt(data.get('base_price')?.toString() ?? '0');
		const category_id = data.get('category_id')?.toString() || null;
		const description = data.get('description')?.toString().trim() || null;
		const tax_rate = parseFloat(data.get('tax_rate')?.toString() ?? '0.10');
		const unit = data.get('unit')?.toString().trim() || 'ea';
		const min_order_qty = parseInt(data.get('min_order_qty')?.toString() ?? '1') || 1;
		const stock_qty = parseInt(data.get('stock_qty')?.toString() ?? '0') || 0;
		const sort_order = parseInt(data.get('sort_order')?.toString() ?? '0') || 0;
		const is_active = data.get('is_active') === 'true';

		if (!sku || !name) return fail(400, { error: 'SKU and name are required' });
		if (isNaN(base_price) || base_price < 0) return fail(400, { error: 'Invalid price' });

		const db = drizzle(platform!.env.DB, { schema });
		try {
			await db.insert(schema.products).values({
				sku, name, description, base_price, tax_rate, unit,
				min_order_qty, stock_qty, sort_order, is_active,
				category_id
			});
		} catch {
			return fail(400, { error: 'SKU already exists' });
		}
		return { success: true };
	},

	update: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const base_price = parseInt(data.get('base_price')?.toString() ?? '0');

		if (!id || !name) return fail(400, { error: 'Invalid request' });
		if (isNaN(base_price) || base_price < 0) return fail(400, { error: 'Invalid price' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.update(schema.products).set({
			name,
			description: data.get('description')?.toString().trim() || null,
			base_price,
			tax_rate: parseFloat(data.get('tax_rate')?.toString() ?? '0.10'),
			unit: data.get('unit')?.toString().trim() || 'ea',
			min_order_qty: parseInt(data.get('min_order_qty')?.toString() ?? '1') || 1,
			stock_qty: parseInt(data.get('stock_qty')?.toString() ?? '0') || 0,
			sort_order: parseInt(data.get('sort_order')?.toString() ?? '0') || 0,
			is_active: data.get('is_active') === 'true',
			category_id: data.get('category_id')?.toString() || null,
			updated_at: now()
		}).where(eq(schema.products.id, id));
		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.products).where(eq(schema.products.id, id));
		return { success: true };
	}
} satisfies Actions;
