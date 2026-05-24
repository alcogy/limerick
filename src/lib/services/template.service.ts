import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import type { ServiceCtx } from './index';
import { TEMPLATE_IDS, TEMPLATE_DEFAULTS, type TemplateId } from './template.constants';

export type { TemplateId };
export { TEMPLATE_IDS, TEMPLATE_DEFAULTS } from './template.constants';

export interface EmailTemplate {
	id: string;
	subject: string;
	body: string;
}

export function applyTemplate(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function getTemplate(ctx: ServiceCtx, id: TemplateId): Promise<EmailTemplate> {
	const [row] = await ctx.db
		.select()
		.from(schema.email_templates)
		.where(eq(schema.email_templates.id, id))
		.limit(1);

	const defaults = TEMPLATE_DEFAULTS[id];
	return {
		id,
		subject: row?.subject || defaults.subject,
		body: row?.body || defaults.body
	};
}

export async function getAllTemplates(ctx: ServiceCtx): Promise<Record<TemplateId, EmailTemplate>> {
	const rows = await ctx.db.select().from(schema.email_templates);
	const stored = Object.fromEntries(rows.map((r) => [r.id, r]));

	const result = {} as Record<TemplateId, EmailTemplate>;
	for (const id of TEMPLATE_IDS) {
		const row = stored[id];
		const defaults = TEMPLATE_DEFAULTS[id];
		result[id] = {
			id,
			subject: row?.subject || defaults.subject,
			body: row?.body || defaults.body
		};
	}
	return result;
}

export async function saveTemplate(
	ctx: ServiceCtx,
	id: TemplateId,
	subject: string,
	body: string
): Promise<void> {
	await ctx.db
		.insert(schema.email_templates)
		.values({ id, subject, body })
		.onConflictDoUpdate({
			target: schema.email_templates.id,
			set: { subject, body, updated_at: sql`(datetime('now'))` }
		});
}
