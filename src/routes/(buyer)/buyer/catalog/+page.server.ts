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

	// Pricing priority: group_price > discount_rate > base_price
	const priceGroupId = buyer?.price_group_id ?? null;
	const discountRate = buyer?.discount_rate ?? null;

	const productsWithPrice = products
		.filter((p) => p.is_active)
		.map((p) => {
			const groupPrice = priceGroupId
				? p.group_prices.find((gp) => gp.price_group_id === priceGroupId)
				: null;
			let contract_price: number;
			let price_type: 'group' | 'rate' | 'base';
			if (groupPrice) {
				contract_price = groupPrice.price;
				price_type = 'group';
			} else if (discountRate !== null) {
				contract_price = Math.floor(p.base_price * discountRate);
				price_type = 'rate';
			} else {
				contract_price = p.base_price;
				price_type = 'base';
			}
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
				contract_price,
				has_group_price: price_type !== 'base'
			};
		});

	return { products: productsWithPrice, categories, categoryFilter };
};
