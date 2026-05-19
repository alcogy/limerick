import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { getInvoiceWithSupplierInfo } from '$lib/services/invoice.service';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const result = await getInvoiceWithSupplierInfo(makeCtx(platform!, locals), params.id);
	if (!result) throw error(404, 'Invoice not found');
	return result;
};
