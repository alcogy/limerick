import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const invoice = await db.query.invoices.findFirst({
		where: and(
			eq(schema.invoices.id, params.id),
			eq(schema.invoices.buyer_id, locals.user!.id)
		),
		with: {
			buyer: { with: { user: true } },
			invoice_orders: { with: { order: { with: { items: true } } } }
		}
	});

	if (!invoice) throw error(404, 'Invoice not found');

	return { invoice };
};
