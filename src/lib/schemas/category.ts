import { z } from 'zod';

export const categoryCreateSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	sort_order: z.coerce.number().int().catch(0)
});

export const categoryUpdateSchema = z.object({
	id: z.string().min(1, 'Invalid request'),
	name: z.string().trim().min(1, 'Name is required'),
	sort_order: z.coerce.number().int().catch(0)
});

export const categoryDeleteSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});
