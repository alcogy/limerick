import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import {
	createBuyer,
	createInvitationToken,
	deleteBuyer,
	listBuyers,
	updateBuyer
} from '$lib/services/buyer.service';
import { parseFormData } from '$lib/utils/form';
import {
	buyerCreateSchema,
	buyerUpdateSchema,
	buyerDeleteSchema,
	buyerInviteSchema
} from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const search = url.searchParams.get('search') || '';
	const result = await listBuyers(ctx, { search });
	return { ...result, search };
};

export const actions = {
	create: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), buyerCreateSchema);
		if (!form.ok) return form.fail;
		return createBuyer(makeCtx(platform!, locals, request), form.data);
	},

	update: async ({ request, platform, locals }) => {
		const formData = await request.formData();
		const form = parseFormData(formData, buyerUpdateSchema);
		if (!form.ok) return form.fail;
		const { id, ...fields } = form.data;
		return updateBuyer(makeCtx(platform!, locals, request), id, fields);
	},

	delete: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), buyerDeleteSchema);
		if (!form.ok) return form.fail;
		return deleteBuyer(makeCtx(platform!, locals, request), form.data.id);
	},

	invite: async ({ request, platform, locals, url }) => {
		const form = parseFormData(await request.formData(), buyerInviteSchema);
		if (!form.ok) return form.fail;
		return createInvitationToken(
			makeCtx(platform!, locals, request),
			form.data.buyer_id,
			url.origin
		);
	}
} satisfies Actions;
