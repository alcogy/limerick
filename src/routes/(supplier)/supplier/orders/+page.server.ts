import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { advanceOrderStatus, cancelOrder, listOrders } from '$lib/services/order.service';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const statusFilter = url.searchParams.get('status') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const result = await listOrders(ctx, { statusFilter, page });
	return { ...result, statusFilter, search: url.searchParams.get('search') || '' };
};

export const actions = {
	confirm: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return advanceOrderStatus(makeCtx(platform!, locals, request), id, 'pending', 'confirmed', 'confirmed_at');
	},

	ship: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return advanceOrderStatus(makeCtx(platform!, locals, request), id, 'confirmed', 'shipped', 'shipped_at');
	},

	complete: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return advanceOrderStatus(makeCtx(platform!, locals, request), id, 'shipped', 'completed', 'completed_at');
	},

	cancel: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return cancelOrder(makeCtx(platform!, locals, request), id);
	}
} satisfies Actions;
