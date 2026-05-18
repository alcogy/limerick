import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/index';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token');
	if (!token) throw redirect(302, '/login');

	const db = drizzle(platform!.env.DB, { schema });
	const invitation = await db.query.invitation_tokens.findFirst({
		where: eq(schema.invitation_tokens.token, token),
		with: { buyer: { with: { user: true } } }
	});

	const now = new Date().toISOString();
	if (!invitation || invitation.used_at || invitation.expires_at < now) {
		return { valid: false, token };
	}

	return {
		valid: true,
		token,
		email: invitation.buyer.user?.email ?? ''
	};
};

export const actions = {
	default: async ({ request, platform }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString();
		const password = data.get('password')?.toString() ?? '';
		const confirm = data.get('confirm')?.toString() ?? '';

		if (!token) return fail(400, { error: 'Invalid request' });
		if (password !== confirm) return fail(400, { error: 'Passwords do not match' });

		const strengthError = validatePasswordStrength(password);
		if (strengthError) return fail(400, { error: strengthError });

		const db = drizzle(platform!.env.DB, { schema });
		const invitation = await db.query.invitation_tokens.findFirst({
			where: eq(schema.invitation_tokens.token, token),
			with: { buyer: true }
		});

		const now = new Date().toISOString();
		if (!invitation || invitation.used_at || invitation.expires_at < now) {
			return fail(400, { error: 'This invitation link is invalid or has expired.' });
		}

		const hashed = await hashPassword(password);
		const userId = invitation.buyer_id;

		await db
			.update(schema.users)
			.set({ password: hashed, is_active: true, updated_at: now })
			.where(eq(schema.users.id, userId));

		await db
			.update(schema.invitation_tokens)
			.set({ used_at: now })
			.where(eq(schema.invitation_tokens.id, invitation.id));

		throw redirect(302, '/login?activated=1');
	}
} satisfies Actions;
