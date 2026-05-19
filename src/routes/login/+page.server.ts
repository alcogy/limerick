import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, count } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { verifyPassword, createSession, SESSION_COOKIE_OPTIONS } from '$lib/server/auth/index';
import { parseFormData } from '$lib/utils/form';
import { loginSchema } from '$lib/schemas';
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
		const form = parseFormData(await request.formData(), loginSchema);
		if (!form.ok) return form.fail;
		const { email, password } = form.data;

		const db = drizzle(platform!.env.DB, { schema });
		const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
			.toISOString()
			.replace('T', ' ')
			.slice(0, 19);
		void windowStart;

		const [[attemptCount]] = await Promise.all([
			db
				.select({ count: count() })
				.from(schema.login_attempts)
				.where(eq(schema.login_attempts.identifier, email))
		]);
		if ((attemptCount?.count ?? 0) >= MAX_ATTEMPTS) {
			return fail(429, { error: `Too many login attempts. Please wait ${WINDOW_MINUTES} minutes.` });
		}

		const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });

		if (!user || !user.password || !user.is_active) {
			await db.insert(schema.login_attempts).values({ identifier: email });
			return fail(401, { error: 'Invalid email or password' });
		}

		if (!(await verifyPassword(password, user.password))) {
			await db.insert(schema.login_attempts).values({ identifier: email });
			return fail(401, { error: 'Invalid email or password' });
		}

		await db.delete(schema.login_attempts).where(eq(schema.login_attempts.identifier, email));

		const token = await createSession(db, user.id);
		cookies.set('session', token, SESSION_COOKIE_OPTIONS);

		if (user.role === 'supplier') throw redirect(302, '/supplier/dashboard');
		throw redirect(302, '/buyer/catalog');
	}
} satisfies Actions;
