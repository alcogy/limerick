import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role === 'supplier') throw redirect(302, '/supplier/dashboard');
	throw redirect(302, '/buyer/catalog');
};
