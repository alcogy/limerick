import { z } from 'zod';

export const orderIdSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});

export const orderEmailSchema = z.object({
	id:      z.string().min(1, 'Invalid request'),
	subject: z.string().trim().min(1, 'Subject is required'),
	body:    z.string().trim().min(1, 'Message is required')
});

const cartItemSchema = z.object({
	id: z.string(),
	qty: z.number().int().min(1),
	price: z.number().min(0),
	tax_rate: z.number().min(0).max(1),
	name: z.string(),
	sku: z.string()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z.object({
	notes: z
		.string()
		.trim()
		.optional()
		.transform((v) => v || null),
	items: z.string().transform((v, ctx) => {
		try {
			const parsed = JSON.parse(v);
			const result = z.array(cartItemSchema).min(1, 'Cart is empty').safeParse(parsed);
			if (!result.success) {
				ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.issues[0]?.message ?? 'Invalid cart data' });
				return z.NEVER;
			}
			return result.data;
		} catch {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid cart data' });
			return z.NEVER;
		}
	})
});
