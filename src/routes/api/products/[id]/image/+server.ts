import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { now } from '$lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
	if (!locals.user || locals.user.role !== 'supplier') throw error(403, 'Forbidden');

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

	const db = drizzle(platform!.env.DB, { schema });

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
