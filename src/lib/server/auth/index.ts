import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

type CookieSerializeOptions = Parameters<RequestEvent['cookies']['set']>[2];

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const ALGORITHM = 'PBKDF2';
const HASH = 'SHA-256';

export const SESSION_COOKIE_OPTIONS: CookieSerializeOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !dev, // Safari rejects secure cookies over http://localhost in local dev
	maxAge: 60 * 60 * 24 * 7 // 7 days
};

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		ALGORITHM,
		false,
		['deriveBits']
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: ALGORITHM, hash: HASH, salt, iterations: ITERATIONS },
		key,
		KEY_LENGTH * 8
	);
	return `${toHex(salt.buffer as ArrayBuffer)}:${toHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	const salt = fromHex(saltHex).buffer as ArrayBuffer;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		ALGORITHM,
		false,
		['deriveBits']
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: ALGORITHM, hash: HASH, salt, iterations: ITERATIONS },
		key,
		KEY_LENGTH * 8
	);
	return toHex(derived) === hashHex;
}

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function createSession(
	db: DrizzleD1Database<typeof schema>,
	userId: string
): Promise<string> {
	const token = generateSessionToken();
	const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		.toISOString()
		.replace('T', ' ')
		.slice(0, 19);
	await db.insert(schema.sessions).values({ id: token, user_id: userId, expires_at });
	return token;
}

export async function deleteSession(
	db: DrizzleD1Database<typeof schema>,
	token: string
): Promise<void> {
	await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
}

export async function getSession(event: RequestEvent) {
	const token = event.cookies.get('session');
	if (!token) return null;

	try {
		const db = drizzle(event.platform!.env.DB, { schema });
		const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

		const session = await db.query.sessions.findFirst({
			where: eq(schema.sessions.id, token),
			with: { user: true }
		});

		if (!session || session.expires_at < now) {
			if (session) await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
			event.cookies.delete('session', { path: '/' });
			return null;
		}

		const user = session.user;
		if (!user || !user.is_active) {
			await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
			event.cookies.delete('session', { path: '/' });
			return null;
		}
		return user;
	} catch {
		event.cookies.delete('session', { path: '/' });
		return null;
	}
}

export function validatePasswordStrength(password: string): string | null {
	if (password.length < 8) return 'Password must be at least 8 characters';
	return null;
}
