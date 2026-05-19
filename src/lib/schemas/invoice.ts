import { z } from 'zod';

export const generateInvoiceSchema = z.object({
	buyer_id: z.string().min(1, 'Buyer is required'),
	period_from: z.string().min(1, 'Period from is required'),
	period_to: z.string().min(1, 'Period to is required'),
	due_date: z.string().min(1, 'Due date is required')
});

export const invoiceIdSchema = z.object({
	id: z.string().min(1, 'Invalid request')
});
