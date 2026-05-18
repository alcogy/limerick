import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = drizzle(platform!.env.DB, { schema });

	const invoices = await db.query.invoices.findMany({
		where: eq(schema.invoices.buyer_id, locals.user!.id),
		orderBy: [desc(schema.invoices.issued_at)]
	});

	return { invoices };
};
