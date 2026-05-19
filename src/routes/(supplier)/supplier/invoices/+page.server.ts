import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { generateInvoice, listInvoices, markInvoicePaid } from '$lib/services/invoice.service';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const statusFilter = url.searchParams.get('status') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	return { ...(await listInvoices(ctx, { statusFilter, page })), statusFilter };
};

export const actions = {
	generate: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const buyer_id    = data.get('buyer_id')?.toString()    ?? '';
		const period_from = data.get('period_from')?.toString() ?? '';
		const period_to   = data.get('period_to')?.toString()   ?? '';
		const due_date    = data.get('due_date')?.toString()     ?? '';

		if (!buyer_id || !period_from || !period_to || !due_date) {
			return fail(400, { error: 'All fields are required' });
		}
		return generateInvoice(makeCtx(platform!, locals, request), { buyer_id, period_from, period_to, due_date });
	},

	markPaid: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return markInvoicePaid(makeCtx(platform!, locals, request), id);
	}
} satisfies Actions;
