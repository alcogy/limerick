import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ platform, locals }) => {
	if (!locals.user || locals.user.role !== 'supplier') throw error(403, 'Forbidden');

	const db = drizzle(platform!.env.DB, { schema });

	const [prefixRow, digitsRow] = await Promise.all([
		db.query.settings.findFirst({ where: eq(schema.settings.key, 'sku_prefix') }),
		db.query.settings.findFirst({ where: eq(schema.settings.key, 'sku_digits') })
	]);

	const prefix = prefixRow?.value ?? 'PROD';
	const digits = parseInt(digitsRow?.value ?? '4');

	// Atomically increment the sequence counter via UPSERT to prevent duplicate SKUs
	// when concurrent requests both read the same counter value.
	const [seqRow] = await db
		.insert(schema.settings)
		.values({ key: 'sku_seq', value: '1' })
		.onConflictDoUpdate({
			target: schema.settings.key,
			set: { value: sql`cast(cast(${schema.settings.value} as integer) + 1 as text)` }
		})
		.returning({ value: schema.settings.value });

	const seq = parseInt(seqRow.value);
	const sku = `${prefix}-${String(seq).padStart(digits, '0')}`;

	return json({ sku });
};
