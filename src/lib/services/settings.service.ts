import * as schema from '$lib/server/db/schema';
import type { ServiceCtx } from './index';

export async function loadSettings(ctx: ServiceCtx) {
	const { db } = ctx;
	const rows = await db.select().from(schema.settings);
	const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		skuPrefix: map['sku_prefix'] ?? 'PROD',
		skuDigits: map['sku_digits'] ?? '4',
		skuSeq: map['sku_seq'] ?? '0',
		companyName: map['company_name'] ?? '',
		companyAddress: map['company_address'] ?? '',
		companyZip: map['company_zip'] ?? '',
		companyTel: map['company_tel'] ?? '',
		companyTaxNo: map['company_tax_no'] ?? '',
		catalogShowImages: map['catalog_show_images'] !== '0' // default: true
	};
}

export async function saveCompanyInfo(
	ctx: ServiceCtx,
	input: { name: string; address: string; zip: string; tel: string; taxNo: string }
) {
	const { db } = ctx;
	await Promise.all([
		upsert(db, 'company_name', input.name),
		upsert(db, 'company_address', input.address),
		upsert(db, 'company_zip', input.zip),
		upsert(db, 'company_tel', input.tel),
		upsert(db, 'company_tax_no', input.taxNo)
	]);
	return { success: true, action: 'saveCompany' };
}

export async function saveCatalogSettings(ctx: ServiceCtx, input: { showImages: boolean }) {
	const { db } = ctx;
	await upsert(db, 'catalog_show_images', input.showImages ? '1' : '0');
	return { success: true, action: 'saveCatalog' };
}

export async function saveSkuRules(
	ctx: ServiceCtx,
	input: { prefix: string; digits: number; seq: number }
) {
	const { db } = ctx;
	await Promise.all([
		upsert(db, 'sku_prefix', input.prefix),
		upsert(db, 'sku_digits', String(input.digits)),
		upsert(db, 'sku_seq', String(input.seq))
	]);
	return { success: true, action: 'saveSku' };
}

async function upsert(db: ServiceCtx['db'], key: string, value: string) {
	await db
		.insert(schema.settings)
		.values({ key, value })
		.onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}
