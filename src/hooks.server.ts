import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { lt } from 'drizzle-orm';
import { getSession } from '$lib/server/auth/index';
import * as schema from '$lib/server/db/schema';

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

	// Lazy cleanup: run on ~1% of requests to avoid accumulation of stale rows
	if (event.platform?.ctx && Math.random() < 0.01) {
		const db = drizzle(event.platform.env.DB, { schema });
		const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
		const nowStr    = new Date().toISOString().replace('T', ' ').slice(0, 19);
		event.platform.ctx.waitUntil(
			Promise.all([
				db.delete(schema.login_attempts).where(lt(schema.login_attempts.attempted_at, cutoff24h)),
				db.delete(schema.sessions).where(lt(schema.sessions.expires_at, nowStr))
			]).catch((err) => console.error('[cleanup]', err))
		);
	}

	const response = await resolve(event);

	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
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
