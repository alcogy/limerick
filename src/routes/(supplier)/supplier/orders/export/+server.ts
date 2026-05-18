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

	const header = buildCsvRow([
		'Order ID', 'Buyer', 'Status',
		'Item SKU', 'Item Name', 'Qty', 'Unit Price', 'Subtotal', 'Tax Rate',
		'Order Subtotal', 'Order Tax', 'Order Total', 'Ordered At'
	]);

	const rows: string[] = [];
	for (const order of orders) {
		if (order.items.length === 0) {
			rows.push(buildCsvRow([
				order.id, order.buyer?.company_name ?? '', order.status,
				'', '', '', '', '', '',
				order.total_amount, order.tax_amount, order.total_amount + order.tax_amount,
				formatDateTime(order.ordered_at)
			]));
		} else {
			for (const [i, item] of order.items.entries()) {
				rows.push(buildCsvRow([
					i === 0 ? order.id : '',
					i === 0 ? (order.buyer?.company_name ?? '') : '',
					i === 0 ? order.status : '',
					item.sku, item.name, item.quantity, item.unit_price, item.subtotal, item.tax_rate,
					i === 0 ? order.total_amount : '',
					i === 0 ? order.tax_amount : '',
					i === 0 ? order.total_amount + order.tax_amount : '',
					i === 0 ? formatDateTime(order.ordered_at) : ''
				]));
			}
		}
	}

	const csv = [header, ...rows].join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
