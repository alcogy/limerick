import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import {
	loadSettings,
	saveCatalogSettings,
	saveCompanyInfo,
	saveSkuRules
} from '$lib/services/settings.service';
import { parseFormData } from '$lib/utils/form';
import { companyInfoSchema, catalogSettingsSchema, skuRulesSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, locals }) => {
	return loadSettings(makeCtx(platform!, locals));
};

export const actions = {
	saveCompany: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), companyInfoSchema);
		if (!form.ok) return form.fail;
		const { company_name, company_address, company_zip, company_tel, company_tax_no } = form.data;
		return saveCompanyInfo(makeCtx(platform!, locals, request), {
			name: company_name,
			address: company_address,
			zip: company_zip,
			tel: company_tel,
			taxNo: company_tax_no
		});
	},

	saveCatalog: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), catalogSettingsSchema);
		if (!form.ok) return form.fail;
		return saveCatalogSettings(makeCtx(platform!, locals, request), {
			showImages: form.data.catalog_show_images
		});
	},

	saveSku: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), skuRulesSchema);
		if (!form.ok) return form.fail;
		return saveSkuRules(makeCtx(platform!, locals, request), {
			prefix: form.data.sku_prefix,
			digits: form.data.sku_digits,
			seq: form.data.sku_seq
		});
	}
} satisfies Actions;
