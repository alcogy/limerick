import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'cancel';

interface AuditOptions {
	db: D1Database;
	user_id: string | null;
	action: AuditAction;
	resource_type: string;
	resource_id?: string;
	metadata?: Record<string, unknown>;
	request?: Request;
}

export async function writeAuditLog(opts: AuditOptions): Promise<void> {
	const orm = drizzle(opts.db, { schema });
	await orm.insert(schema.audit_logs).values({
		user_id:       opts.user_id,
		action:        opts.action,
		resource_type: opts.resource_type,
		resource_id:   opts.resource_id ?? null,
		metadata:      opts.metadata ? JSON.stringify(opts.metadata) : null,
		ip_address:    opts.request?.headers.get('CF-Connecting-IP') ?? null,
		user_agent:    opts.request?.headers.get('User-Agent')?.slice(0, 512) ?? null
	});
}
