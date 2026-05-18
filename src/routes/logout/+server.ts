import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE_OPTIONS } from '$lib/server/auth/index';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', { path: SESSION_COOKIE_OPTIONS.path as string });
	throw redirect(302, '/login');
};

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('session', { path: SESSION_COOKIE_OPTIONS.path as string });
	throw redirect(302, '/login');
};
