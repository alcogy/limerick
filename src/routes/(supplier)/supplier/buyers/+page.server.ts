import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { asc, desc, eq, like, and, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/index';
import { now } from '$lib/utils';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const search = url.searchParams.get('search') || '';

	const conditions = search
		? [or(
				like(schema.buyers.company_name, `%${search}%`),
				like(schema.users.email, `%${search}%`)
			)]
		: [];

	const [buyerRows, priceGroups] = await Promise.all([
		db
			.select({
				id: schema.buyers.id,
				company_name: schema.buyers.company_name,
				email: schema.users.email,
				name: schema.users.name,
				is_active: schema.users.is_active,
				price_group_id: schema.buyers.price_group_id,
				closing_day: schema.buyers.closing_day,
				phone: schema.buyers.phone,
				address: schema.buyers.address,
				payment_terms: schema.buyers.payment_terms,
				notes: schema.buyers.notes,
				created_at: schema.buyers.created_at
			})
			.from(schema.buyers)
			.innerJoin(schema.users, eq(schema.users.id, schema.buyers.id))
			.where(conditions.length ? and(...conditions) : undefined)
			.orderBy(desc(schema.buyers.created_at)),
		db.select().from(schema.price_groups).orderBy(asc(schema.price_groups.name))
	]);

	return { buyers: buyerRows, priceGroups, search };
};

export const actions = {
	create: async ({ request, platform }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const name = data.get('name')?.toString().trim();
		const company_name = data.get('company_name')?.toString().trim();
		const price_group_id = data.get('price_group_id')?.toString() || null;
		const closing_day = parseInt(data.get('closing_day')?.toString() ?? '20') || 20;
		const phone = data.get('phone')?.toString().trim() || null;
		const address = data.get('address')?.toString().trim() || null;
		const payment_terms = data.get('payment_terms')?.toString().trim() || null;
		const notes = data.get('notes')?.toString().trim() || null;

		if (!email || !name || !company_name) {
			return fail(400, { error: 'Email, name, and company name are required' });
		}

		const db = drizzle(platform!.env.DB, { schema });

		// Check duplicate email
		const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
		if (existing) return fail(400, { error: 'Email already registered' });

		const userId = crypto.randomUUID();
		await db.insert(schema.users).values({
			id: userId, email, name, role: 'buyer', is_active: false
		});
		await db.insert(schema.buyers).values({
			id: userId, company_name, price_group_id, closing_day,
			phone, address, payment_terms, notes
		});

		return { success: true };
	},

	update: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const company_name = data.get('company_name')?.toString().trim();

		if (!id || !name || !company_name) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		const ts = now();

		await Promise.all([
			db.update(schema.users).set({ name, updated_at: ts }).where(eq(schema.users.id, id)),
			db.update(schema.buyers).set({
				company_name,
				price_group_id: data.get('price_group_id')?.toString() || null,
				closing_day: parseInt(data.get('closing_day')?.toString() ?? '20') || 20,
				phone: data.get('phone')?.toString().trim() || null,
				address: data.get('address')?.toString().trim() || null,
				payment_terms: data.get('payment_terms')?.toString().trim() || null,
				notes: data.get('notes')?.toString().trim() || null,
				updated_at: ts
			}).where(eq(schema.buyers.id, id))
		]);

		return { success: true };
	},

	delete: async ({ request, platform }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });
		await db.delete(schema.users).where(eq(schema.users.id, id));
		return { success: true };
	},

	invite: async ({ request, platform, url }) => {
		const data = await request.formData();
		const buyer_id = data.get('buyer_id')?.toString();
		if (!buyer_id) return fail(400, { error: 'Invalid request' });

		const db = drizzle(platform!.env.DB, { schema });

		// Invalidate previous unused tokens
		const existingTokens = await db.query.invitation_tokens.findMany({
			where: eq(schema.invitation_tokens.buyer_id, buyer_id)
		});
		for (const t of existingTokens) {
			if (!t.used_at) {
				await db.delete(schema.invitation_tokens).where(eq(schema.invitation_tokens.id, t.id));
			}
		}

		const token = crypto.randomUUID();
		const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

		await db.insert(schema.invitation_tokens).values({ buyer_id, token, expires_at });

		// In production, send email here. For now, return the invite URL.
		const inviteUrl = `${url.origin}/auth/setup-password?token=${token}`;

		return { success: true, inviteUrl };
	}
} satisfies Actions;
