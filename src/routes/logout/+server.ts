import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE_OPTIONS, deleteSession } from '$lib/server/auth/index';
import * as schema from '$lib/server/db/schema';

const logout: RequestHandler = async ({ cookies, platform }) => {
	const token = cookies.get('session');
	if (token && platform) {
		const db = drizzle(platform.env.DB, { schema });
		await deleteSession(db, token).catch(() => {});
	}
	cookies.delete('session', { path: SESSION_COOKIE_OPTIONS.path as string });
	throw redirect(302, '/login');
};

export const GET = logout;
export const POST = logout;
