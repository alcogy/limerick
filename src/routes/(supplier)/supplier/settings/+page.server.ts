import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

const SKU_KEYS = ['sku_prefix', 'sku_digits', 'sku_seq'] as const;

export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });
	const rows = await db.select().from(schema.settings);
	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		skuPrefix: map['sku_prefix'] ?? 'PROD',
		skuDigits: map['sku_digits'] ?? '4',
		skuSeq:    map['sku_seq']    ?? '0'
	};
};

export const actions = {
	saveSku: async ({ request, platform }) => {
		const data = await request.formData();
		const prefix = data.get('sku_prefix')?.toString().trim().toUpperCase() || 'PROD';
		const digits = Math.max(1, Math.min(8, parseInt(data.get('sku_digits')?.toString() ?? '4') || 4));
		const seq    = Math.max(0, parseInt(data.get('sku_seq')?.toString()    ?? '0') || 0);

		const db = drizzle(platform!.env.DB, { schema });
		for (const [key, value] of [['sku_prefix', prefix], ['sku_digits', String(digits)], ['sku_seq', String(seq)]]) {
			await db
				.insert(schema.settings)
				.values({ key, value })
				.onConflictDoUpdate({ target: schema.settings.key, set: { value } });
		}
		return { success: true };
	}
} satisfies Actions;
