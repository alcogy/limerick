import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const obj = await platform!.env.BUCKET.get(params.key);
	if (!obj) throw error(404, 'Not found');

	const headers = new Headers();
	// writeHttpMetadata throws in miniflare local dev; set Content-Type manually
	try {
		obj.writeHttpMetadata(headers);
	} catch {
		const ct = obj.httpMetadata?.contentType ?? 'application/octet-stream';
		headers.set('Content-Type', ct);
	}
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(obj.body, { headers });
};
