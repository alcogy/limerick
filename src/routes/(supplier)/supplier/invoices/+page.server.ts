import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { generateInvoice, listInvoices, markInvoicePaid } from '$lib/services/invoice.service';
import { parseFormData } from '$lib/utils/form';
import { generateInvoiceSchema, invoiceIdSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const statusFilter = url.searchParams.get('status') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	return { ...(await listInvoices(ctx, { statusFilter, page })), statusFilter };
};

export const actions = {
	generate: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), generateInvoiceSchema);
		if (!form.ok) return form.fail;
		return generateInvoice(makeCtx(platform!, locals, request), form.data);
	},

	markPaid: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), invoiceIdSchema);
		if (!form.ok) return form.fail;
		return markInvoicePaid(makeCtx(platform!, locals, request), form.data.id);
	}
} satisfies Actions;
