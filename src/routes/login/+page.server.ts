import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { verifyPassword, SESSION_COOKIE_OPTIONS } from '$lib/server/auth/index';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		if (locals.user.role === 'supplier') throw redirect(302, '/supplier/dashboard');
		throw redirect(302, '/buyer/catalog');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const db = drizzle(platform!.env.DB, { schema });
		const user = await db.query.users.findFirst({
			where: eq(schema.users.email, email)
		});

		if (!user || !user.password || !user.is_active) {
			return fail(401, { error: 'Invalid email or password' });
		}

		if (!(await verifyPassword(password, user.password))) {
			return fail(401, { error: 'Invalid email or password' });
		}

		cookies.set('session', user.id, SESSION_COOKIE_OPTIONS);

		if (user.role === 'supplier') throw redirect(302, '/supplier/dashboard');
		throw redirect(302, '/buyer/catalog');
	}
} satisfies Actions;
