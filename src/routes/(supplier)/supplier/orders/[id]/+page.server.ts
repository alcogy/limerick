import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { makeCtx } from '$lib/services';
import { advanceOrderStatus, cancelOrder } from '$lib/services/order.service';
import { sendOrderEmail } from '$lib/services/email.service';
import { getTemplate, applyTemplate } from '$lib/services/template.service';
import { parseFormData } from '$lib/utils/form';
import { orderIdSchema, orderEmailSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = drizzle(platform!.env.DB, { schema });
	const ctx = makeCtx(platform!, locals);

	const [order, settingsRows, tpl] = await Promise.all([
		db.query.orders.findFirst({
			where: eq(schema.orders.id, params.id),
			with: {
				buyer: { with: { user: true } },
				items: { orderBy: (i, { asc }) => [asc(i.line_no)] }
			}
		}),
		db.select().from(schema.settings),
		getTemplate(ctx, 'order_message')
	]);

	if (!order) throw error(404, 'Order not found');

	const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
	const vars = {
		buyer_name: order.buyer?.company_name ?? '',
		order_number: order.id.slice(0, 8).toUpperCase()
	};

	return {
		order,
		supplier: {
			name: s['company_name'] ?? '',
			address: s['company_address'] ?? '',
			zip: s['company_zip'] ?? '',
			tel: s['company_tel'] ?? '',
			taxNo: s['company_tax_no'] ?? ''
		},
		emailDefaults: {
			subject: applyTemplate(tpl.subject, vars),
			body: applyTemplate(tpl.body, vars)
		}
	};
};

export const actions = {
	confirm: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), orderIdSchema);
		if (!form.ok) return form.fail;
		return advanceOrderStatus(
			makeCtx(platform!, locals, request),
			form.data.id,
			'pending',
			'confirmed',
			'confirmed_at'
		);
	},

	ship: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), orderIdSchema);
		if (!form.ok) return form.fail;
		return advanceOrderStatus(
			makeCtx(platform!, locals, request),
			form.data.id,
			'confirmed',
			'shipped',
			'shipped_at'
		);
	},

	complete: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), orderIdSchema);
		if (!form.ok) return form.fail;
		return advanceOrderStatus(
			makeCtx(platform!, locals, request),
			form.data.id,
			'shipped',
			'completed',
			'completed_at'
		);
	},

	cancel: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), orderIdSchema);
		if (!form.ok) return form.fail;
		return cancelOrder(makeCtx(platform!, locals, request), form.data.id);
	},

	email: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), orderEmailSchema);
		if (!form.ok) return form.fail;
		try {
			await sendOrderEmail(
				makeCtx(platform!, locals, request),
				form.data.id,
				form.data.subject,
				form.data.body
			);
			return { emailSent: true };
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to send email';
			return fail(500, { emailError: msg });
		}
	}
} satisfies Actions;
