import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { buildCsvRow, formatDateTime } from '$lib/utils';

export const GET: RequestHandler = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const orders = await db.query.orders.findMany({
		orderBy: [desc(schema.orders.ordered_at)],
		with: { buyer: true, items: true }
	});

	const header = buildCsvRow(['Order ID', 'Buyer', 'Status', 'Subtotal', 'Tax', 'Total', 'Ordered At']);

	const rows = orders.flatMap((o) => {
		const base = [
			o.id, o.buyer?.company_name ?? '', o.status,
			o.total_amount, o.tax_amount, o.total_amount + o.tax_amount,
			formatDateTime(o.ordered_at)
		];
		return [buildCsvRow(base)];
	});

	const csv = [header, ...rows].join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
