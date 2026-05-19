import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth/index';

let platform: App.Platform;

export const handle: Handle = async ({ event, resolve }) => {
	if (dev) {
		const { getPlatformProxy } = await import('wrangler');
		platform ??= (await getPlatformProxy()) as unknown as App.Platform;
		event.platform = platform;
	}

	const session = await getSession(event);

	if (session) {
		event.locals.user = {
			id: session.id,
			email: session.email,
			name: session.name,
			role: session.role
		};
	} else {
		event.locals.user = null;
	}

	// Read locale from cookie for SSR
	const localeCookie = event.cookies.get('limerick_lang');
	event.locals.locale = localeCookie === 'ja' ? 'ja' : 'en';

	const publicPaths = ['/login', '/auth/setup-password', '/logout', '/setup'];
	const isPublic = publicPaths.some(
		(p) => event.url.pathname === p || event.url.pathname.startsWith(p + '?')
	);

	if (!event.locals.user && !isPublic) {
		return new Response(null, {
			status: 302,
			headers: { location: '/login' }
		});
	}

	// Role-based route guard
	if (event.locals.user) {
		const path = event.url.pathname;
		if (path.startsWith('/supplier') && event.locals.user.role !== 'supplier') {
			return new Response(null, { status: 302, headers: { location: '/buyer/catalog' } });
		}
		if (path.startsWith('/buyer') && event.locals.user.role !== 'buyer') {
			return new Response(null, { status: 302, headers: { location: '/supplier/dashboard' } });
		}
	}

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'", // required for SvelteKit hydration + inline theme/lang scripts
		"style-src 'self' 'unsafe-inline'",  // required for Svelte scoped styles
		"img-src 'self' data: blob:",
		"connect-src 'self'",
		"font-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	].join('; '));

	return response;
};
