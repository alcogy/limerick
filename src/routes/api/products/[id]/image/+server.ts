import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { and, count, eq, gte } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_LIMIT = 30;          // max uploads per hour per user
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
	if (!locals.user || locals.user.role !== 'supplier') throw error(403, 'Forbidden');

	const db = drizzle(platform!.env.DB, { schema });
	const windowStart = new Date(Date.now() - UPLOAD_WINDOW_MS)
		.toISOString().replace('T', ' ').slice(0, 19);

	const [[uploadCount]] = await Promise.all([
		db.select({ count: count() })
			.from(schema.login_attempts)
			.where(and(
				eq(schema.login_attempts.identifier, `upload:${locals.user.id}`),
				gte(schema.login_attempts.attempted_at, windowStart)
			))
	]);
	if ((uploadCount?.count ?? 0) >= UPLOAD_LIMIT) {
		throw error(429, 'Upload rate limit exceeded. Try again later.');
	}
	await db.insert(schema.login_attempts).values({
		identifier: `upload:${locals.user.id}`
	});

	const formData = await request.formData();
	const file = (formData.get('file') ?? formData.get('image')) as File | null;

	if (!file || file.size === 0) throw error(400, 'No image provided');
	if (!ALLOWED_TYPES.includes(file.type)) throw error(400, 'Invalid file type. Use JPEG, PNG, WebP, or GIF.');
	if (file.size > MAX_SIZE) throw error(400, 'File too large (max 5 MB)');

	const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
	const key = `products/${params.id}/${crypto.randomUUID()}.${ext}`;

	await platform!.env.BUCKET.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	// Delete old image if exists
	const existing = await db.query.products.findFirst({ where: eq(schema.products.id, params.id) });
	if (existing?.image_key) {
		await platform!.env.BUCKET.delete(existing.image_key).catch(() => {});
	}

	await db.update(schema.products)
		.set({ image_key: key, updated_at: now() })
		.where(eq(schema.products.id, params.id));

	return json({ key });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
	if (!locals.user || locals.user.role !== 'supplier') throw error(403, 'Forbidden');

	const db = drizzle(platform!.env.DB, { schema });
	const product = await db.query.products.findFirst({ where: eq(schema.products.id, params.id) });

	if (product?.image_key) {
		await platform!.env.BUCKET.delete(product.image_key).catch(() => {});
		await db.update(schema.products)
			.set({ image_key: null, updated_at: now() })
			.where(eq(schema.products.id, params.id));
	}

	return json({ success: true });
};
