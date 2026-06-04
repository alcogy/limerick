import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, gte, sql } from 'drizzle-orm';
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

			// Early validation for friendly error message (before any writes)
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

		// Phase 1: Atomically decrement stock with a WHERE guard to prevent overselling.
		// If another request consumed the last units between our read and this write,
		// the affected-rows count will be 0 and we roll back any prior decrements.
		const decremented: Array<{ product_id: string; quantity: number }> = [];
		for (const item of orderItems) {
			const result = await db
				.update(schema.products)
				.set({ stock_qty: sql`stock_qty - ${item.quantity}`, updated_at: ts })
				.where(
					and(
						eq(schema.products.id, item.product_id),
						gte(schema.products.stock_qty, item.quantity)
					)
				)
				.returning({ id: schema.products.id });

			if (result.length === 0) {
				// Race condition: stock was taken by a concurrent request — roll back
				if (decremented.length > 0) {
					await Promise.all(
						decremented.map((d) =>
							db
								.update(schema.products)
								.set({ stock_qty: sql`stock_qty + ${d.quantity}` })
								.where(eq(schema.products.id, d.product_id))
						)
					);
				}
				const p = productMap.get(item.product_id);
				return fail(400, {
					error: `Insufficient stock for "${p?.name ?? item.sku}". Please update your cart.`
				});
			}
			decremented.push({ product_id: item.product_id, quantity: item.quantity });
		}

		// Phase 2: Create order now that stock is reserved
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

		throw redirect(302, '/buyer/orders?placed=1');
	}
} satisfies Actions;
