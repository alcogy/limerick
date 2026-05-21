import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { createEmailProvider } from '$lib/server/email/index';
import { CloudflareEmailProvider } from '$lib/server/email/cloudflare';
import {
	buyerInvitationEmail,
	adminAlertEmail,
	type AdminAlertEmailData
} from '$lib/server/email/templates';
import type { ServiceCtx } from './index';

const RateLimit = {
	windowMs: 60_000,
	maxPerWindow: 10
} as const;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
	const now = Date.now();
	const entry = rateLimitStore.get(key);
	if (!entry || now > entry.resetAt) {
		rateLimitStore.set(key, { count: 1, resetAt: now + RateLimit.windowMs });
		return true;
	}
	if (entry.count >= RateLimit.maxPerWindow) return false;
	entry.count++;
	return true;
}

/**
 * Send a buyer invitation email with the password setup link.
 * Uses the HTTP provider (Resend/SES/SMTP).
 * Never throws; errors are logged to console.
 */
export async function sendInvitationEmail(
	ctx: ServiceCtx,
	buyerId: string,
	setupUrl: string
): Promise<void> {
	try {
		if (!ctx.env.EMAIL_FROM) return;
		if (!checkRateLimit(`invite:${buyerId}`)) return;

		const [buyer] = await ctx.db
			.select({
				name:         schema.users.name,
				email:        schema.users.email,
				company_name: schema.buyers.company_name
			})
			.from(schema.buyers)
			.innerJoin(schema.users, eq(schema.users.id, schema.buyers.id))
			.where(eq(schema.buyers.id, buyerId))
			.limit(1);

		if (!buyer) return;

		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
		const supplierName = ctx.env.SUPPLIER_NAME || 'Your supplier';

		const provider = createEmailProvider(ctx.env);
		const { subject, html, text } = buyerInvitationEmail({
			buyerName:    buyer.name,
			companyName:  buyer.company_name,
			supplierName,
			setupUrl,
			expiresAt
		});
		await provider.send({ to: buyer.email, subject, html, text });
	} catch (err) {
		console.error('[email] sendInvitationEmail failed:', err);
	}
}

function createAlertProvider(env: Env, alertTo: string): ReturnType<typeof createEmailProvider> {
	if (env.SEND_EMAIL) {
		if (!env.EMAIL_FROM) throw new Error('EMAIL_FROM is not configured');
		return new CloudflareEmailProvider(env.SEND_EMAIL, env.EMAIL_FROM, alertTo);
	}
	return createEmailProvider(env);
}

/**
 * Send an alert email to the configured admin address.
 * Reads alert_email_to from the settings table; falls back to ALERT_EMAIL_TO env var.
 * Uses Cloudflare send_email binding when available, otherwise the HTTP provider.
 */
export async function sendAdminAlert(ctx: ServiceCtx, data: AdminAlertEmailData): Promise<void> {
	const alertEnabled = await ctx.db
		.select({ value: schema.settings.value })
		.from(schema.settings)
		.where(eq(schema.settings.key, 'alert_email_enabled'))
		.limit(1)
		.then((rows) => rows[0]?.value !== 'false');

	if (!alertEnabled) return;

	const alertTo = await ctx.db
		.select({ value: schema.settings.value })
		.from(schema.settings)
		.where(eq(schema.settings.key, 'notification_email'))
		.limit(1)
		.then((rows) => rows[0]?.value || ctx.env.ALERT_EMAIL_TO);

	if (!alertTo) return;
	if (!checkRateLimit(`alert:${data.subject}`)) return;

	const provider = createAlertProvider(ctx.env, alertTo);
	const { subject, html, text } = adminAlertEmail(data);
	await provider.send({ to: alertTo, subject, html, text });
}

/**
 * Fire-and-forget admin alert — never throws, safe to call from any handler.
 */
export function sendAdminAlertSilent(ctx: ServiceCtx, data: AdminAlertEmailData): void {
	sendAdminAlert(ctx, data).catch((err) => {
		console.error('[email] sendAdminAlert failed:', err);
	});
}

/**
 * Send an admin alert using only Env — for unauthenticated contexts (e.g. login failures).
 * Never throws.
 */
export function sendAdminAlertFromEnv(env: Env, data: AdminAlertEmailData): void {
	const alertTo = env.ALERT_EMAIL_TO;
	if (!alertTo) return;
	if (!checkRateLimit(`alert:${data.subject}`)) return;

	try {
		const provider = createAlertProvider(env, alertTo);
		const { subject, html, text } = adminAlertEmail(data);
		provider.send({ to: alertTo, subject, html, text }).catch((err) => {
			console.error('[email] sendAdminAlertFromEnv failed:', err);
		});
	} catch (err) {
		console.error('[email] sendAdminAlertFromEnv setup failed:', err);
	}
}

export { type AdminAlertEmailData };
