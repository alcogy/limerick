import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

const PER_PAGE = 50;

export const load: PageServerLoad = async ({ platform, locals, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const categoryFilter = url.searchParams.get('category') || '';
	const search         = url.searchParams.get('search')   || '';
	const sortBy         = url.searchParams.get('sort')     || 'sort_order';
	const page           = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const orderByMap = {
		sort_order: [asc(schema.products.sort_order), asc(schema.products.name)],
		name_asc:   [asc(schema.products.name)],
		price_asc:  [asc(schema.products.base_price)],
		price_desc: [desc(schema.products.base_price)]
	};
	const orderBy = orderByMap[sortBy as keyof typeof orderByMap] ?? orderByMap.sort_order;

	const conditions = [eq(schema.products.is_active, true)];
	if (categoryFilter) conditions.push(eq(schema.products.category_id, categoryFilter));
	if (search) conditions.push(or(
		like(schema.products.name, `%${search}%`),
		like(schema.products.sku,  `%${search}%`)
	)!);
	const where = and(...conditions);

	const [[countResult], products, categories, buyer] = await Promise.all([
		db.select({ count: count() }).from(schema.products).where(where),
		db.query.products.findMany({
			where,
			orderBy,
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
			with: { category: true, group_prices: true }
		}),
		db.select().from(schema.categories).orderBy(asc(schema.categories.sort_order)),
		db.query.buyers.findFirst({ where: eq(schema.buyers.id, locals.user!.id) })
	]);

	const total      = countResult?.count ?? 0;
	const totalPages = Math.ceil(total / PER_PAGE);

	// Pricing priority: group_price > discount_rate > base_price
	const priceGroupId = buyer?.price_group_id ?? null;
	const discountRate = buyer?.discount_rate ?? null;

	const productsWithPrice = products.map((p) => {
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
			image_key: p.image_key,
			category: p.category,
			contract_price,
			has_group_price: price_type !== 'base'
		};
	});

	return { products: productsWithPrice, categories, categoryFilter, sortBy, search, page, total, totalPages };
};
