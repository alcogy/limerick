import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { makeCtx } from '$lib/services';
import { getAllTemplates, saveTemplate, type TemplateId } from '$lib/services/template.service';
import { parseFormData } from '$lib/utils/form';
import { emailTemplateSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const ctx = makeCtx(platform!, locals);
	const templates = await getAllTemplates(ctx);
	return { templates };
};

export const actions = {
	save: async ({ request, platform, locals }) => {
		const form = parseFormData(await request.formData(), emailTemplateSchema);
		if (!form.ok) return form.fail;

		const validIds: TemplateId[] = ['invitation', 'order_message'];
		if (!validIds.includes(form.data.id as TemplateId)) {
			return fail(400, { error: 'Invalid template id' });
		}

		const ctx = makeCtx(platform!, locals, request);
		await saveTemplate(ctx, form.data.id as TemplateId, form.data.subject, form.data.body);
		return { success: true, savedId: form.data.id };
	}
} satisfies Actions;
