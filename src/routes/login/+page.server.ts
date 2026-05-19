import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, gte, count } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { verifyPassword, createSession, SESSION_COOKIE_OPTIONS } from '$lib/server/auth/index';
import type { Actions, PageServerLoad } from './$types';

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

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
		const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
			.toISOString().replace('T', ' ').slice(0, 19);

		// Check rate limit
		const [[attemptCount]] = await Promise.all([
			db.select({ count: count() })
				.from(schema.login_attempts)
				.where(eq(schema.login_attempts.identifier, email))
		]);
		const recentCount = attemptCount?.count ?? 0;

		if (recentCount >= MAX_ATTEMPTS) {
			return fail(429, { error: `Too many login attempts. Please wait ${WINDOW_MINUTES} minutes.` });
		}

		const user = await db.query.users.findFirst({
			where: eq(schema.users.email, email)
		});

		if (!user || !user.password || !user.is_active) {
			await db.insert(schema.login_attempts).values({ identifier: email });
			return fail(401, { error: 'Invalid email or password' });
		}

		if (!(await verifyPassword(password, user.password))) {
			await db.insert(schema.login_attempts).values({ identifier: email });
			return fail(401, { error: 'Invalid email or password' });
		}

		// Success: clear attempts
		await db.delete(schema.login_attempts)
			.where(eq(schema.login_attempts.identifier, email));

		const token = await createSession(db, user.id);
		cookies.set('session', token, SESSION_COOKIE_OPTIONS);

		if (user.role === 'supplier') throw redirect(302, '/supplier/dashboard');
		throw redirect(302, '/buyer/catalog');
	}
} satisfies Actions;
