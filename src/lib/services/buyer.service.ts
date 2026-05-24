import { fail } from '@sveltejs/kit';
import { asc, desc, eq, isNull, like, and, or } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { writeAuditLog } from '$lib/server/audit';
import { now } from '$lib/utils';
import { INVITATION_EXPIRY_MS } from '$lib/constants';
import type { ServiceCtx } from './index';
import { requireSupplier } from './index';
import { sendInvitationEmail } from './email.service';

export async function listBuyers(ctx: ServiceCtx, opts: { search: string }) {
	const { db } = ctx;
	const { search } = opts;

	const conditions = search
		? [or(like(schema.buyers.company_name, `%${search}%`), like(schema.users.email, `%${search}%`))]
		: [];

	const [buyerRows, priceGroups, tokens] = await Promise.all([
		db
			.select({
				id: schema.buyers.id,
				company_name: schema.buyers.company_name,
				email: schema.users.email,
				name: schema.users.name,
				is_active: schema.users.is_active,
				price_group_id: schema.buyers.price_group_id,
				discount_rate: schema.buyers.discount_rate,
				closing_day: schema.buyers.closing_day,
				phone: schema.buyers.phone,
				zip: schema.buyers.zip,
				address: schema.buyers.address,
				payment_terms: schema.buyers.payment_terms,
				notes: schema.buyers.notes,
				created_at: schema.buyers.created_at
			})
			.from(schema.buyers)
			.innerJoin(schema.users, eq(schema.users.id, schema.buyers.id))
			.where(conditions.length ? and(...conditions) : undefined)
			.orderBy(desc(schema.buyers.created_at)),
		db.select().from(schema.price_groups).orderBy(asc(schema.price_groups.name)),
		db.select().from(schema.invitation_tokens).where(isNull(schema.invitation_tokens.used_at))
	]);

	const tokenMap: Record<string, { expires_at: string; expired: boolean }> = {};
	for (const tok of tokens) {
		const existing = tokenMap[tok.buyer_id];
		const expired = new Date(tok.expires_at) < new Date();
		if (!existing || tok.expires_at > existing.expires_at) {
			tokenMap[tok.buyer_id] = { expires_at: tok.expires_at, expired };
		}
	}

	return {
		buyers: buyerRows.map((b) => ({ ...b, invitation: tokenMap[b.id] ?? null })),
		priceGroups
	};
}

export async function createBuyer(
	ctx: ServiceCtx, // supplier only
	input: {
		email: string;
		name: string;
		company_name: string;
		price_group_id: string | null;
		discount_rate: number | null;
		closing_day: number;
		phone: string | null;
		zip: string | null;
		address: string | null;
		payment_terms: string | null;
		notes: string | null;
	}
) {
	requireSupplier(ctx);
	const { db, env, user, request } = ctx;
	const { email, name, company_name } = input;

	if (!email || !name || !company_name) {
		return fail(400, { error: 'Email, name, and company name are required' });
	}
	if (input.discount_rate !== null && (input.discount_rate < 0 || input.discount_rate > 1)) {
		return fail(400, { error: 'Discount rate must be between 0 and 1' });
	}

	const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
	if (existing) return fail(400, { error: 'Email already registered' });

	const userId = crypto.randomUUID();
	await db
		.insert(schema.users)
		.values({ id: userId, email, name, role: 'buyer', is_active: false });
	await db.insert(schema.buyers).values({ id: userId, ...input });

	await writeAuditLog({
		db: env.DB,
		user_id: user?.id ?? null,
		action: 'create',
		resource_type: 'buyer',
		resource_id: userId,
		request
	});
	return { success: true };
}

export async function updateBuyer(
	ctx: ServiceCtx, // supplier only
	id: string,
	input: {
		email: string;
		name: string;
		company_name: string;
		price_group_id: string | null;
		discount_rate: number | null;
		closing_day: number;
		phone: string | null;
		zip: string | null;
		address: string | null;
		payment_terms: string | null;
		notes: string | null;
	}
) {
	requireSupplier(ctx);
	const { db, env, user, request } = ctx;
	if (!id || !input.name || !input.company_name) return fail(400, { error: 'Invalid request' });

	if (input.email) {
		const conflict = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) });
		if (conflict && conflict.id !== id) return fail(400, { error: 'Email already in use' });
	}

	const ts = now();
	const { email, ...buyerFields } = input;
	await Promise.all([
		db
			.update(schema.users)
			.set({ name: input.name, email, updated_at: ts })
			.where(eq(schema.users.id, id)),
		db
			.update(schema.buyers)
			.set({ ...buyerFields, updated_at: ts })
			.where(eq(schema.buyers.id, id))
	]);

	await writeAuditLog({
		db: env.DB,
		user_id: user?.id ?? null,
		action: 'update',
		resource_type: 'buyer',
		resource_id: id,
		request
	});
	return { success: true };
}

export async function deleteBuyer(ctx: ServiceCtx, id: string) {
	requireSupplier(ctx);
	const { db, env, user, request } = ctx;
	if (!id) return fail(400, { error: 'Invalid request' });

	await db.delete(schema.users).where(eq(schema.users.id, id));
	await writeAuditLog({
		db: env.DB,
		user_id: user?.id ?? null,
		action: 'delete',
		resource_type: 'buyer',
		resource_id: id,
		request
	});
	return { success: true };
}

export async function createInvitationToken(ctx: ServiceCtx, buyer_id: string, origin: string) {
	const { db } = ctx;
	if (!buyer_id) return fail(400, { error: 'Invalid request' });

	const existingTokens = await db.query.invitation_tokens.findMany({
		where: eq(schema.invitation_tokens.buyer_id, buyer_id)
	});
	for (const t of existingTokens) {
		if (!t.used_at) {
			await db.delete(schema.invitation_tokens).where(eq(schema.invitation_tokens.id, t.id));
		}
	}

	// 256-bit cryptographically random token (vs UUID which is 122-bit with fixed format)
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	const token = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const expires_at = new Date(Date.now() + INVITATION_EXPIRY_MS).toISOString();
	await db.insert(schema.invitation_tokens).values({ buyer_id, token, expires_at });

	const inviteUrl = `${origin}/auth/setup-password?token=${token}`;

	// Send invitation email (fire-and-forget; UI still shows the URL as fallback)
	sendInvitationEmail(ctx, buyer_id, inviteUrl).catch((err) => {
		console.error('[email] sendInvitationEmail failed:', err);
	});

	return { success: true, inviteUrl };
}
