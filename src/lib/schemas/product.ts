import { z } from 'zod';

const productBase = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	description: z
		.string()
		.trim()
		.optional()
		.transform((v) => v || null),
	base_price: z.coerce.number().int().min(0, 'Price must be 0 or more'),
	tax_rate: z.coerce.number().min(0).max(1).catch(0.1),
	unit: z.string().trim().default('ea'),
	min_order_qty: z.coerce.number().int().min(1).catch(1),
	stock_qty: z.coerce.number().int().min(0).catch(0),
	sort_order: z.coerce.number().int().catch(0),
	is_active: z
		.string()
		.optional()
		.transform((v) => v === 'true'),
	category_id: z
		.string()
		.optional()
		.transform((v) => v || null)
});

export const productCreateSchema = productBase.extend({
	sku: z.string().trim().min(1, 'SKU is required')
});

export const productUpdateSchema = productBase.extend({
	id: z.string().min(1, 'Invalid request')
});

export const productDeleteSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});
