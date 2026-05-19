import { z } from 'zod';

const nullableStr = z
	.string()
	.trim()
	.optional()
	.transform((v) => v || null);

const nullableFloat = z.preprocess(
	(v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
	z.coerce
		.number()
		.optional()
		.transform((v) => v ?? null)
);

const buyerBase = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	company_name: z.string().trim().min(1, 'Company name is required'),
	price_group_id: nullableStr,
	discount_rate: nullableFloat,
	closing_day: z.coerce.number().int().min(1).max(31).catch(20),
	phone: nullableStr,
	zip: nullableStr,
	address: nullableStr,
	payment_terms: nullableStr,
	notes: nullableStr
});

export const buyerCreateSchema = buyerBase.extend({
	email: z.string().trim().toLowerCase().email('Invalid email')
});

export const buyerUpdateSchema = buyerBase.extend({
	id: z.string().min(1, 'Invalid request')
});

export const buyerDeleteSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});

export const buyerInviteSchema = z.object({
	buyer_id: z.string().min(1, 'Invalid request')
});
