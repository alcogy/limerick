import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { hashPassword, verifyPassword, validatePasswordStrength } from '$lib/server/auth/index';
import { now } from '$lib/utils';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return { user: locals.user };
};

export const actions = {
	default: async ({ request, platform, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const currentPassword = data.get('current_password')?.toString();
		const newPassword = data.get('new_password')?.toString() ?? '';
		const confirmPassword = data.get('confirm_password')?.toString() ?? '';

		if (!currentPassword || !newPassword) {
			return fail(400, { error: 'All password fields are required' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		const strengthErr = validatePasswordStrength(newPassword);
		if (strengthErr) return fail(400, { error: strengthErr });

		const db = drizzle(platform!.env.DB, { schema });
		const user = await db.query.users.findFirst({ where: eq(schema.users.id, locals.user.id) });
		if (!user || !user.password) return fail(404, { error: 'User not found' });

		if (!(await verifyPassword(currentPassword, user.password))) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		await db.update(schema.users)
			.set({ password: await hashPassword(newPassword), updated_at: now() })
			.where(eq(schema.users.id, locals.user.id));

		return { success: true };
	}
} satisfies Actions;
