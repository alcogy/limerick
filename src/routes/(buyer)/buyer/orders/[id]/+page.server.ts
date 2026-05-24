import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const [order, settingsRows] = await Promise.all([
		db.query.orders.findFirst({
			where: and(eq(schema.orders.id, params.id), eq(schema.orders.buyer_id, locals.user!.id)),
			with: {
				buyer: { with: { user: true } },
				items: { orderBy: (i, { asc }) => [asc(i.line_no)] }
			}
		}),
		db.select().from(schema.settings)
	]);

	if (!order) throw error(404, 'Order not found');

	const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
	return {
		order,
		supplier: {
			name: s['company_name'] ?? '',
			address: s['company_address'] ?? '',
			zip: s['company_zip'] ?? '',
			tel: s['company_tel'] ?? '',
			taxNo: s['company_tax_no'] ?? ''
		}
	};
};
