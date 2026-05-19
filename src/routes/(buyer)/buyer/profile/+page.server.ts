import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { hashPassword, verifyPassword, validatePasswordStrength } from '$lib/server/auth/index';
import { now } from '$lib/utils';
import { parseFormData } from '$lib/utils/form';
import { changePasswordSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return { user: locals.user };
};

export const actions = {
	default: async ({ request, platform, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const form = parseFormData(await request.formData(), changePasswordSchema);
		if (!form.ok) return form.fail;
		const { current_password, new_password, confirm_password } = form.data;

		if (new_password !== confirm_password) {
			return fail(400, { error: 'Passwords do not match' });
		}

		const strengthErr = validatePasswordStrength(new_password);
		if (strengthErr) return fail(400, { error: strengthErr });

		const db = drizzle(platform!.env.DB, { schema });
		const user = await db.query.users.findFirst({ where: eq(schema.users.id, locals.user.id) });
		if (!user || !user.password) return fail(404, { error: 'User not found' });

		if (!(await verifyPassword(current_password, user.password))) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		await db
			.update(schema.users)
			.set({ password: await hashPassword(new_password), updated_at: now() })
			.where(eq(schema.users.id, locals.user.id));

		return { success: true };
	}
} satisfies Actions;
