import { fail } from '@sveltejs/kit';
import { asc, count, desc, eq, like, and, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';
import type { ServiceCtx } from './index';

const PER_PAGE = 30;

export async function listProducts(
	ctx: ServiceCtx,
	opts: { search: string; categoryFilter: string; page: number }
) {
	const { db } = ctx;
	const { search, categoryFilter, page } = opts;

	const conditions = [];
	if (search) {
		conditions.push(or(like(schema.products.name, `%${search}%`), like(schema.products.sku, `%${search}%`)));
	}
	if (categoryFilter) {
		conditions.push(eq(schema.products.category_id, categoryFilter));
	}
	const where = conditions.length ? and(...conditions) : undefined;

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
		totalPages: Math.ceil((countResult?.count ?? 0) / PER_PAGE)
	};
}

export async function createProduct(
	ctx: ServiceCtx,
	input: {
		sku: string;
		name: string;
		description: string | null;
		base_price: number;
		tax_rate: number;
		unit: string;
		min_order_qty: number;
		stock_qty: number;
		sort_order: number;
		is_active: boolean;
		category_id: string | null;
	}
) {
	const { db } = ctx;
	if (!input.sku || !input.name) return fail(400, { error: 'SKU and name are required' });
	if (isNaN(input.base_price) || input.base_price < 0) return fail(400, { error: 'Invalid price' });

	try {
		await db.insert(schema.products).values(input);
	} catch {
		return fail(400, { error: 'SKU already exists' });
	}
	return { success: true };
}

export async function updateProduct(
	ctx: ServiceCtx,
	id: string,
	input: {
		name: string;
		description: string | null;
		base_price: number;
		tax_rate: number;
		unit: string;
		min_order_qty: number;
		stock_qty: number;
		sort_order: number;
		is_active: boolean;
		category_id: string | null;
	}
) {
	const { db } = ctx;
	if (!id || !input.name) return fail(400, { error: 'Invalid request' });
	if (isNaN(input.base_price) || input.base_price < 0) return fail(400, { error: 'Invalid price' });

	await db.update(schema.products)
		.set({ ...input, updated_at: now() })
		.where(eq(schema.products.id, id));
	return { success: true };
}

export async function deleteProduct(ctx: ServiceCtx, id: string) {
	const { db } = ctx;
	if (!id) return fail(400, { error: 'Invalid request' });
	await db.delete(schema.products).where(eq(schema.products.id, id));
	return { success: true };
}
