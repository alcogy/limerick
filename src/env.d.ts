// Extend Env with secrets configured via `wrangler secret put`.
// These are not listed in wrangler.jsonc vars, so wrangler types does not generate them.
interface Env {
	// Resend provider
	RESEND_API_KEY: string;
	// AWS SES provider
	AWS_ACCESS_KEY_ID: string;
	AWS_SECRET_ACCESS_KEY: string;
	AWS_REGION: string;
	// SMTP relay provider
	SMTP_API_URL: string;
	SMTP_API_KEY: string;
}
