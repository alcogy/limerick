import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const obj = await platform!.env.BUCKET.get(params.key);
	if (!obj) throw error(404, 'Not found');

	const headers = new Headers();
	obj.writeHttpMetadata(headers);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(obj.body, { headers });
};
