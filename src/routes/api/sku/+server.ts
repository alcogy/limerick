import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ platform, locals }) => {
	if (!locals.user || locals.user.role !== 'supplier') throw error(403, 'Forbidden');

	const db = drizzle(platform!.env.DB, { schema });

	const [prefixRow, digitsRow, seqRow] = await Promise.all([
		db.query.settings.findFirst({ where: eq(schema.settings.key, 'sku_prefix') }),
		db.query.settings.findFirst({ where: eq(schema.settings.key, 'sku_digits') }),
		db.query.settings.findFirst({ where: eq(schema.settings.key, 'sku_seq') })
	]);

	const prefix = prefixRow?.value ?? 'PROD';
	const digits = parseInt(digitsRow?.value ?? '4');
	const seq = parseInt(seqRow?.value ?? '0') + 1;

	const sku = `${prefix}-${String(seq).padStart(digits, '0')}`;

	// Persist incremented counter
	await db
		.insert(schema.settings)
		.values({ key: 'sku_seq', value: String(seq) })
		.onConflictDoUpdate({ target: schema.settings.key, set: { value: String(seq) } });

	return json({ sku });
};
