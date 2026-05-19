import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '$lib/server/db/schema';


export const load: PageServerLoad = async ({ platform }) => {
	const db = drizzle(platform!.env.DB, { schema });
	const rows = await db.select().from(schema.settings);
	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		skuPrefix:      map['sku_prefix']      ?? 'PROD',
		skuDigits:      map['sku_digits']      ?? '4',
		skuSeq:         map['sku_seq']         ?? '0',
		companyName:    map['company_name']    ?? '',
		companyAddress: map['company_address'] ?? '',
		companyTel:     map['company_tel']     ?? ''
	};
};

async function upsertSetting(db: DrizzleD1Database<typeof schema>, key: string, value: string) {
	await db
		.insert(schema.settings)
		.values({ key, value })
		.onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}

export const actions = {
	saveCompany: async ({ request, platform }) => {
		const data = await request.formData();
		const name    = data.get('company_name')?.toString().trim()    ?? '';
		const address = data.get('company_address')?.toString().trim() ?? '';
		const tel     = data.get('company_tel')?.toString().trim()     ?? '';

		const db = drizzle(platform!.env.DB, { schema });
		await Promise.all([
			upsertSetting(db, 'company_name',    name),
			upsertSetting(db, 'company_address', address),
			upsertSetting(db, 'company_tel',     tel)
		]);
		return { success: true, action: 'saveCompany' };
	},

	saveSku: async ({ request, platform }) => {
		const data = await request.formData();
		const prefix = data.get('sku_prefix')?.toString().trim().toUpperCase() || 'PROD';
		const digits = Math.max(1, Math.min(8, parseInt(data.get('sku_digits')?.toString() ?? '4') || 4));
		const seq    = Math.max(0, parseInt(data.get('sku_seq')?.toString()    ?? '0') || 0);

		const db = drizzle(platform!.env.DB, { schema });
		await Promise.all([
			upsertSetting(db, 'sku_prefix', prefix),
			upsertSetting(db, 'sku_digits', String(digits)),
			upsertSetting(db, 'sku_seq',    String(seq))
		]);
		return { success: true, action: 'saveSku' };
	}
} satisfies Actions;
