import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const [[productsCount], [buyersCount], [pendingCount], recentOrders] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(schema.products)
			.where(eq(schema.products.is_active, true)),
		db.select({ count: sql<number>`count(*)` }).from(schema.buyers),
		db
			.select({ count: sql<number>`count(*)` })
			.from(schema.orders)
			.where(eq(schema.orders.status, 'pending')),
		db.query.orders.findMany({
			orderBy: [desc(schema.orders.created_at)],
			limit: 10,
			with: { buyer: true }
		})
	]);

	return {
		stats: {
			products: productsCount.count,
			buyers: buyersCount.count,
			pendingOrders: pendingCount.count
		},
		recentOrders
	};
};
