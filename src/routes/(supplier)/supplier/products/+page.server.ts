import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import {
	createProduct,
	deleteProduct,
	listProducts,
	updateProduct
} from '$lib/services/product.service';
import { parseFormData } from '$lib/utils/form';
import { productCreateSchema, productUpdateSchema, productDeleteSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const search = url.searchParams.get('search') || '';
	const categoryFilter = url.searchParams.get('category') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const result = await listProducts(ctx, { search, categoryFilter, page });
	return { ...result, search, categoryFilter };
};

export const actions = {
	create: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), productCreateSchema);
		if (!form.ok) return form.fail;
		return createProduct(makeCtx(platform!, locals, request), form.data);
	},

	update: async ({ request, platform, locals }) => {
		const formData = await request.formData();
		const form = parseFormData(formData, productUpdateSchema);
		if (!form.ok) return form.fail;
		const { id, ...fields } = form.data;
		return updateProduct(makeCtx(platform!, locals, request), id, fields);
	},

	delete: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), productDeleteSchema);
		if (!form.ok) return form.fail;
		return deleteProduct(makeCtx(platform!, locals, request), form.data.id);
	}
} satisfies Actions;
