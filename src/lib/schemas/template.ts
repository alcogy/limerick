import { z } from 'zod';

export const emailTemplateSchema = z.object({
	id: z.string().min(1),
	subject: z.string().trim(),
	body: z.string().trim()
});
