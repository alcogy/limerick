import { eq, sql } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import type { ServiceCtx } from './index';

export interface EmailTemplate {
	id: string;
	subject: string;
	body: string;
}

const TEMPLATE_IDS = ['invitation', 'order_message'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

const DEFAULTS: Record<TemplateId, { subject: string; body: string }> = {
	invitation: {
		subject: "You've been invited to {{supplier_name}}'s ordering portal",
		body: `Dear {{buyer_name}},

You have been invited to access the wholesale ordering portal for {{supplier_name}}.

Please click the link below to set up your password and activate your account:
{{setup_url}}

This invitation expires on {{expires_at}}.`
	},
	order_message: {
		subject: 'Regarding your order #{{order_number}}',
		body: 'Dear {{buyer_name}},\n\n'
	}
};

export const TEMPLATE_VARIABLES: Record<TemplateId, string[]> = {
	invitation: ['buyer_name', 'company_name', 'supplier_name', 'setup_url', 'expires_at'],
	order_message: ['buyer_name', 'order_number']
};

export function applyTemplate(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function getTemplate(ctx: ServiceCtx, id: TemplateId): Promise<EmailTemplate> {
	const [row] = await ctx.db
		.select()
		.from(schema.email_templates)
		.where(eq(schema.email_templates.id, id))
		.limit(1);

	const defaults = DEFAULTS[id];
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
		const defaults = DEFAULTS[id];
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

export { TEMPLATE_IDS, DEFAULTS as TEMPLATE_DEFAULTS };
