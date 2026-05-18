import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions = {
	checkout: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const notes = data.get('notes')?.toString().trim() || null;
		const itemsJson = data.get('items')?.toString();

		if (!itemsJson) return fail(400, { error: 'Cart is empty' });

		let items: { id: string; qty: number; price: number; tax_rate: number; name: string; sku: string }[];
		try {
			items = JSON.parse(itemsJson);
		} catch {
			return fail(400, { error: 'Invalid cart data' });
		}

		if (!items.length) return fail(400, { error: 'Cart is empty' });

		const db = drizzle(platform!.env.DB, { schema });

		// Verify products still exist and get latest prices
		const productIds = items.map((i) => i.id);
		const products = await db.query.products.findMany({
			where: eq(schema.products.is_active, true),
			with: { group_prices: true }
		});

		const buyer = await db.query.buyers.findFirst({
			where: eq(schema.buyers.id, locals.user!.id)
		});

		const priceGroupId  = buyer?.price_group_id ?? null;
		const discountRate  = buyer?.discount_rate   ?? null;

		const productMap = new Map(products.map((p) => [p.id, p]));

		const orderItems: {
			product_id: string; sku: string; name: string;
			unit_price: number; tax_rate: number; quantity: number; subtotal: number;
		}[] = [];

		let total_amount = 0;
		let tax_amount = 0;

		for (const item of items) {
			const product = productMap.get(item.id);
			if (!product) continue;

			const quantity = Math.max(1, item.qty);

			// Stock check
			if (product.stock_qty < quantity) {
				return fail(400, { error: `Insufficient stock for "${product.name}" (available: ${product.stock_qty})` });
			}

			// Pricing priority: group_price > discount_rate > base_price
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
		const [order] = await db.insert(schema.orders).values({
			buyer_id: locals.user!.id,
			status: 'pending',
			total_amount,
			tax_amount,
			notes,
			ordered_at: ts
		}).returning();

		await db.insert(schema.order_items).values(
			orderItems.map((item) => ({ ...item, order_id: order.id }))
		);

		// Decrement stock for each ordered product
		for (const item of orderItems) {
			await db.update(schema.products)
				.set({ stock_qty: sql`stock_qty - ${item.quantity}`, updated_at: ts })
				.where(eq(schema.products.id, item.product_id));
		}

		throw redirect(302, '/buyer/orders?placed=1');
	}
} satisfies Actions;
