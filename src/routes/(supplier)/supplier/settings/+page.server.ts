import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { loadSettings, saveCatalogSettings, saveCompanyInfo, saveSkuRules } from '$lib/services/settings.service';

export const load: PageServerLoad = async ({ platform, locals }) => {
	return loadSettings(makeCtx(platform!, locals));
};

export const actions = {
	saveCompany: async ({ request, platform, locals }) => {
		const data = await request.formData();
		return saveCompanyInfo(makeCtx(platform!, locals, request), {
			name:    data.get('company_name')?.toString().trim()    ?? '',
			address: data.get('company_address')?.toString().trim() ?? '',
			zip:     data.get('company_zip')?.toString().trim()     ?? '',
			tel:     data.get('company_tel')?.toString().trim()     ?? '',
			taxNo:   data.get('company_tax_no')?.toString().trim()  ?? ''
		});
	},

	saveCatalog: async ({ request, platform, locals }) => {
		const data = await request.formData();
		return saveCatalogSettings(makeCtx(platform!, locals, request), {
			showImages: data.get('catalog_show_images') === '1'
		});
	},

	saveSku: async ({ request, platform, locals }) => {
		const data   = await request.formData();
		const prefix = data.get('sku_prefix')?.toString().trim().toUpperCase() || 'PROD';
		const digits = Math.max(1, Math.min(8, parseInt(data.get('sku_digits')?.toString() ?? '4') || 4));
		const seq    = Math.max(0, parseInt(data.get('sku_seq')?.toString() ?? '0') || 0);
		return saveSkuRules(makeCtx(platform!, locals, request), { prefix, digits, seq });
	}
} satisfies Actions;
