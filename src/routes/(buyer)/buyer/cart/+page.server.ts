import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';
import { parseFormData } from '$lib/utils/form';
import { checkoutSchema } from '$lib/schemas';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions = {
	checkout: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), checkoutSchema);
		if (!form.ok) return form.fail;
		const { notes, items } = form.data;

		const db = drizzle(platform!.env.DB, { schema });

		const products = await db.query.products.findMany({
			where: eq(schema.products.is_active, true),
			with: { group_prices: true }
		});

		const buyer = await db.query.buyers.findFirst({
			where: eq(schema.buyers.id, locals.user!.id)
		});

		const priceGroupId = buyer?.price_group_id ?? null;
		const discountRate = buyer?.discount_rate ?? null;
		const productMap = new Map(products.map((p) => [p.id, p]));

		const orderItems: {
			product_id: string;
			line_no: number;
			sku: string;
			name: string;
			unit_price: number;
			tax_rate: number;
			quantity: number;
			subtotal: number;
		}[] = [];
		let lineNo = 1;
		let total_amount = 0;
		let tax_amount = 0;

		for (const item of items) {
			const product = productMap.get(item.id);
			if (!product) continue;

			const quantity = Math.max(1, item.qty);

			if (product.stock_qty < quantity) {
				return fail(400, {
					error: `Insufficient stock for "${product.name}" (available: ${product.stock_qty})`
				});
			}

			const groupPrice = priceGroupId
				? product.group_prices.find((gp) => gp.price_group_id === priceGroupId)
				: null;
			const unit_price = groupPrice
				? groupPrice.price
				: discountRate !== null
					? Math.floor(product.base_price * discountRate)
					: product.base_price;
			const subtotal = unit_price * quantity;
			const item_tax = Math.floor(subtotal * product.tax_rate);

			total_amount += subtotal;
			tax_amount += item_tax;

			orderItems.push({
				product_id: product.id,
				line_no: lineNo++,
				sku: product.sku,
				name: product.name,
				unit_price,
				tax_rate: product.tax_rate,
				quantity,
				subtotal
			});
		}

		if (!orderItems.length) return fail(400, { error: 'No valid products in cart' });

		const ts = now();
		const [order] = await db
			.insert(schema.orders)
			.values({
				buyer_id: locals.user!.id,
				status: 'pending',
				total_amount,
				tax_amount,
				notes,
				ordered_at: ts
			})
			.returning();

		await db
			.insert(schema.order_items)
			.values(orderItems.map((item) => ({ ...item, order_id: order.id })));

		for (const item of orderItems) {
			await db
				.update(schema.products)
				.set({ stock_qty: sql`stock_qty - ${item.quantity}`, updated_at: ts })
				.where(eq(schema.products.id, item.product_id));
		}

		throw redirect(302, '/buyer/orders?placed=1');
	}
} satisfies Actions;
