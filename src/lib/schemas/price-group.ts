import { z } from 'zod';

export const priceGroupCreateSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	description: z
		.string()
		.trim()
		.optional()
		.transform((v) => v || null)
});

export const priceGroupUpdateSchema = z.object({
	id: z.string().min(1, 'Invalid request'),
	name: z.string().trim().min(1, 'Name is required'),
	description: z
		.string()
		.trim()
		.optional()
		.transform((v) => v || null)
});

export const priceGroupDeleteSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});

export const setPricesGroupSchema = z.object({
	group_id: z.string().min(1, 'Invalid request')
});
