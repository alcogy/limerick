import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import {
	createBuyer,
	createInvitationToken,
	deleteBuyer,
	listBuyers,
	updateBuyer
} from '$lib/services/buyer.service';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx    = makeCtx(platform!, locals);
	const search = url.searchParams.get('search') || '';
	const result = await listBuyers(ctx, { search });
	return { ...result, search };
};

export const actions = {
	create: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const email          = data.get('email')?.toString().trim().toLowerCase() ?? '';
		const name           = data.get('name')?.toString().trim()                ?? '';
		const company_name   = data.get('company_name')?.toString().trim()        ?? '';
		const price_group_id = data.get('price_group_id')?.toString()             || null;
		const dr             = data.get('discount_rate')?.toString().trim();
		const discount_rate  = dr ? parseFloat(dr) : null;
		const closing_day    = parseInt(data.get('closing_day')?.toString() ?? '20') || 20;
		const phone          = data.get('phone')?.toString().trim()          || null;
		const address        = data.get('address')?.toString().trim()        || null;
		const payment_terms  = data.get('payment_terms')?.toString().trim()  || null;
		const notes          = data.get('notes')?.toString().trim()          || null;

		const zip = data.get('zip')?.toString().trim() || null;
		return createBuyer(makeCtx(platform!, locals, request), {
			email, name, company_name, price_group_id, discount_rate,
			closing_day, phone, zip, address, payment_terms, notes
		});
	},

	update: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id           = data.get('id')?.toString()                            ?? '';
		const name         = data.get('name')?.toString().trim()                   ?? '';
		const company_name = data.get('company_name')?.toString().trim()           ?? '';
		const dr           = data.get('discount_rate')?.toString().trim();
		const discount_rate = dr ? parseFloat(dr) : null;

		return updateBuyer(makeCtx(platform!, locals, request), id, {
			name,
			company_name,
			price_group_id:  data.get('price_group_id')?.toString()  || null,
			discount_rate:   discount_rate !== null && !isNaN(discount_rate) ? discount_rate : null,
			closing_day:     parseInt(data.get('closing_day')?.toString() ?? '20') || 20,
			phone:           data.get('phone')?.toString().trim()         || null,
			zip:             data.get('zip')?.toString().trim()           || null,
			address:         data.get('address')?.toString().trim()       || null,
			payment_terms:   data.get('payment_terms')?.toString().trim() || null,
			notes:           data.get('notes')?.toString().trim()         || null
		});
	},

	delete: async ({ request, platform, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString() ?? '';
		return deleteBuyer(makeCtx(platform!, locals, request), id);
	},

	invite: async ({ request, platform, locals, url }) => {
		const data     = await request.formData();
		const buyer_id = data.get('buyer_id')?.toString() ?? '';
		if (!buyer_id) return fail(400, { error: 'Invalid request' });
		return createInvitationToken(makeCtx(platform!, locals, request), buyer_id, url.origin);
	}
} satisfies Actions;
