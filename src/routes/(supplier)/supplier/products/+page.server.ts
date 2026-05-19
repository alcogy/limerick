import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { createProduct, deleteProduct, listProducts, updateProduct } from '$lib/services/product.service';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx            = makeCtx(platform!, locals);
	const search         = url.searchParams.get('search')   || '';
	const categoryFilter = url.searchParams.get('category') || '';
	const page           = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const result = await listProducts(ctx, { search, categoryFilter, page });
	return { ...result, search, categoryFilter };
};

export const actions = {
	create: async ({ request, platform, locals }) => {
		const data = await request.formData();
		return createProduct(makeCtx(platform!, locals, request), {
			sku:           data.get('sku')?.toString().trim()          ?? '',
			name:          data.get('name')?.toString().trim()         ?? '',
			description:   data.get('description')?.toString().trim()  || null,
			base_price:    parseInt(data.get('base_price')?.toString() ?? '0'),
			tax_rate:      parseFloat(data.get('tax_rate')?.toString() ?? '0.10'),
			unit:          data.get('unit')?.toString().trim()         || 'ea',
			min_order_qty: parseInt(data.get('min_order_qty')?.toString() ?? '1') || 1,
			stock_qty:     parseInt(data.get('stock_qty')?.toString()     ?? '0') || 0,
			sort_order:    parseInt(data.get('sort_order')?.toString()    ?? '0') || 0,
			is_active:     data.get('is_active') === 'true',
			category_id:   data.get('category_id')?.toString() || null
		});
	},

	update: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id   = data.get('id')?.toString() ?? '';
		return updateProduct(makeCtx(platform!, locals, request), id, {
			name:          data.get('name')?.toString().trim()         ?? '',
			description:   data.get('description')?.toString().trim()  || null,
			base_price:    parseInt(data.get('base_price')?.toString() ?? '0'),
			tax_rate:      parseFloat(data.get('tax_rate')?.toString() ?? '0.10'),
			unit:          data.get('unit')?.toString().trim()         || 'ea',
			min_order_qty: parseInt(data.get('min_order_qty')?.toString() ?? '1') || 1,
			stock_qty:     parseInt(data.get('stock_qty')?.toString()     ?? '0') || 0,
			sort_order:    parseInt(data.get('sort_order')?.toString()    ?? '0') || 0,
			is_active:     data.get('is_active') === 'true',
			category_id:   data.get('category_id')?.toString() || null
		});
	},

	delete: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id   = data.get('id')?.toString() ?? '';
		return deleteProduct(makeCtx(platform!, locals, request), id);
	}
} satisfies Actions;
