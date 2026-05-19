import { fail } from '@sveltejs/kit';
import type { ActionFailure } from '@sveltejs/kit';
import { z } from 'zod';

type ParseOk<T> = { ok: true; data: T };
type ParseFail = { ok: false; fail: ActionFailure<{ error: string }> };

export function parseFormData<T>(
	formData: FormData,
	schema: z.ZodType<T>
): ParseOk<T> | ParseFail {
	const raw = Object.fromEntries(formData);
	const result = schema.safeParse(raw);
	if (!result.success) {
		const msg = result.error.issues[0]?.message ?? 'Invalid input';
		return { ok: false, fail: fail(400, { error: msg }) };
	}
	return { ok: true, data: result.data };
}
