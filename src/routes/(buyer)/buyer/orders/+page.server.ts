import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform, locals, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const placed = url.searchParams.get('placed') === '1';

	const orders = await db.query.orders.findMany({
		where: eq(schema.orders.buyer_id, locals.user!.id),
		orderBy: [desc(schema.orders.ordered_at)],
		with: { items: { orderBy: (i, { asc }) => [asc(i.line_no)], with: { product: true } } }
	});

	return { orders, placed };
};
