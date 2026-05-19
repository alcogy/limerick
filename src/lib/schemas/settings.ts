import { z } from 'zod';

export const companyInfoSchema = z.object({
	company_name: z.string().trim().default(''),
	company_address: z.string().trim().default(''),
	company_zip: z.string().trim().default(''),
	company_tel: z.string().trim().default(''),
	company_tax_no: z.string().trim().default('')
});

export const catalogSettingsSchema = z.object({
	catalog_show_images: z
		.string()
		.optional()
		.transform((v) => v === '1')
});

export const skuRulesSchema = z.object({
	sku_prefix: z.string().trim().transform((v) => (v || 'PROD').toUpperCase()),
	sku_digits: z.coerce.number().int().min(1).max(8).catch(4),
	sku_seq: z.coerce.number().int().min(0).catch(0)
});
