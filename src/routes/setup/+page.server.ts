import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/db/schema';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/index';
import { parseFormData } from '$lib/utils/form';
import { setupAccountSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (locals.user) throw redirect(302, '/supplier/dashboard');

	const db = drizzle(platform!.env.DB, { schema });
	const existing = await db.select().from(schema.users).limit(1);
	if (existing.length > 0) throw redirect(302, '/login');

	return {};
};

export const actions = {
	default: async ({ request, platform }) => {
		const db = drizzle(platform!.env.DB, { schema });
		const existing = await db.select().from(schema.users).limit(1);
		if (existing.length > 0) return fail(403, { error: 'Setup already completed.' });

		const form = parseFormData(await request.formData(), setupAccountSchema);
		if (!form.ok) return form.fail;
		const { name, email, password, confirm } = form.data;

		if (password !== confirm) return fail(400, { error: 'Passwords do not match.' });

		const strengthErr = validatePasswordStrength(password);
		if (strengthErr) return fail(400, { error: strengthErr });

		await db.insert(schema.users).values({
			email,
			name,
			password: await hashPassword(password),
			role: 'supplier',
			is_active: true
		});

		throw redirect(302, '/login?setup=1');
	}
} satisfies Actions;
