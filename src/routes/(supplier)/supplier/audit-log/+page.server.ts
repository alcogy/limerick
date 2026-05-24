import type { PageServerLoad } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { PAGE_SIZE_LIST } from '$lib/constants';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = drizzle(platform!.env.DB, { schema });
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const [logs, users] = await Promise.all([
		db
			.select()
			.from(schema.audit_logs)
			.orderBy(desc(schema.audit_logs.created_at))
			.limit(PAGE_SIZE_LIST)
			.offset((page - 1) * PAGE_SIZE_LIST),
		db
			.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
			.from(schema.users)
	]);

	const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

	const total =
		logs.length < PAGE_SIZE_LIST
			? (page - 1) * PAGE_SIZE_LIST + logs.length
			: page * PAGE_SIZE_LIST + 1;
	return { logs, userMap, page, totalPages: Math.ceil(total / PAGE_SIZE_LIST) };
};
