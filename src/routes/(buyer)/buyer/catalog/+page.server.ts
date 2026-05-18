import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform, locals, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const categoryFilter = url.searchParams.get('category') || '';

	const [products, categories, buyer] = await Promise.all([
		db.query.products.findMany({
			where: categoryFilter
				? eq(schema.products.category_id, categoryFilter)
				: eq(schema.products.is_active, true),
			orderBy: [asc(schema.products.name)],
			with: { category: true, group_prices: true }
		}),
		db.select().from(schema.categories).orderBy(asc(schema.categories.sort_order)),
		db.query.buyers.findFirst({ where: eq(schema.buyers.id, locals.user!.id) })
	]);

	// Resolve contract price: group_price if available, else base_price
	const priceGroupId = buyer?.price_group_id ?? null;

	const productsWithPrice = products
		.filter((p) => p.is_active)
		.map((p) => {
			const groupPrice = priceGroupId
				? p.group_prices.find((gp) => gp.price_group_id === priceGroupId)
				: null;
			return {
				id: p.id,
				sku: p.sku,
				name: p.name,
				description: p.description,
				base_price: p.base_price,
				tax_rate: p.tax_rate,
				unit: p.unit,
				min_order_qty: p.min_order_qty,
				stock_qty: p.stock_qty,
				category: p.category,
				contract_price: groupPrice?.price ?? p.base_price,
				has_group_price: !!groupPrice
			};
		});

	return { products: productsWithPrice, categories, categoryFilter };
};
