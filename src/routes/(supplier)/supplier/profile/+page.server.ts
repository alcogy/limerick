import { fail } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
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
		const name = data.get('name')?.toString().trim();
		const currentPassword = data.get('current_password')?.toString();
		const newPassword = data.get('new_password')?.toString();

		if (!name) return fail(400, { error: 'Name is required' });

		const db = drizzle(platform!.env.DB, { schema });
		const user = await db.query.users.findFirst({ where: eq(schema.users.id, locals.user.id) });
		if (!user) return fail(404, { error: 'User not found' });

		const updates: Partial<typeof schema.users.$inferInsert> = { name, updated_at: now() };

		if (newPassword) {
			if (!currentPassword || !user.password) {
				return fail(400, { error: 'Current password is required' });
			}
			if (!(await verifyPassword(currentPassword, user.password))) {
				return fail(400, { error: 'Current password is incorrect' });
			}
			const strengthErr = validatePasswordStrength(newPassword);
			if (strengthErr) return fail(400, { error: strengthErr });
			updates.password = await hashPassword(newPassword);
		}

		await db.update(schema.users).set(updates).where(eq(schema.users.id, locals.user.id));

		return { success: true };
	}
} satisfies Actions;
