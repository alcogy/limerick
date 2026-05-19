import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { hashPassword, verifyPassword, validatePasswordStrength } from '$lib/server/auth/index';
import { now } from '$lib/utils';
import { parseFormData } from '$lib/utils/form';
import { updateProfileSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return { user: locals.user };
};

export const actions = {
	default: async ({ request, platform, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const form = parseFormData(await request.formData(), updateProfileSchema);
		if (!form.ok) return form.fail;
		const { name, current_password, new_password } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		const user = await db.query.users.findFirst({ where: eq(schema.users.id, locals.user.id) });
		if (!user) return fail(404, { error: 'User not found' });

		const updates: Partial<typeof schema.users.$inferInsert> = { name, updated_at: now() };

		if (new_password) {
			if (!current_password || !user.password) {
				return fail(400, { error: 'Current password is required' });
			}
			if (!(await verifyPassword(current_password, user.password))) {
				return fail(400, { error: 'Current password is incorrect' });
			}
			const strengthErr = validatePasswordStrength(new_password);
			if (strengthErr) return fail(400, { error: strengthErr });
			updates.password = await hashPassword(new_password);
		}

		await db.update(schema.users).set(updates).where(eq(schema.users.id, locals.user.id));

		return { success: true };
	}
} satisfies Actions;
