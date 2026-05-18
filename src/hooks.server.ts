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

	return response;
};
