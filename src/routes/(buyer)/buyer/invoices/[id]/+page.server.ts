import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const [invoice, settingsRows] = await Promise.all([
		db.query.invoices.findFirst({
			where: and(
				eq(schema.invoices.id, params.id),
				eq(schema.invoices.buyer_id, locals.user!.id)
			),
			with: {
				buyer: { with: { user: true } },
				invoice_orders: { with: { order: { with: { items: true } } } }
			}
		}),
		db.select().from(schema.settings)
	]);

	if (!invoice) throw error(404, 'Invoice not found');

	const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
	return {
		invoice,
		supplier: {
			name:    s['company_name']    ?? '',
			address: s['company_address'] ?? '',
			tel:     s['company_tel']     ?? ''
		}
	};
};
