/**
 * Seed script: creates accounts for local development.
 * Usage:
 *   bun run scripts/seed.ts                          # supplier: admin@example.com / password
 *   SEED_ROLE=buyer bun run scripts/seed.ts          # buyer:    buyer@example.com / password
 *   SEED_EMAIL=x@y.com SEED_PASSWORD=xxx bun run scripts/seed.ts
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '../src/lib/server/db/schema';

const DB_PATH =
	'.wrangler/state/v3/d1/miniflare-D1DatabaseObject/9ba2b04bf514d9facfd57ed57d849e77241a7adc99d1c1545d06688b43d84248.sqlite';

const ROLE = (process.env.SEED_ROLE ?? 'supplier') as 'supplier' | 'buyer';
const EMAIL =
	process.env.SEED_EMAIL ?? (ROLE === 'buyer' ? 'buyer@example.com' : 'admin@example.com');
const PASSWORD = process.env.SEED_PASSWORD ?? 'password';
const NAME = process.env.SEED_NAME ?? (ROLE === 'buyer' ? 'Test Buyer' : 'Admin');
const COMPANY = process.env.SEED_COMPANY ?? 'Test Company';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
		key,
		KEY_LENGTH * 8
	);
	return `${toHex(salt.buffer as ArrayBuffer)}:${toHex(derived)}`;
}

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const existing = db.select().from(schema.users).all();
if (existing.some((u) => u.email === EMAIL)) {
	console.log(`User ${EMAIL} already exists. Skipping.`);
	process.exit(0);
}

const hash = await hashPassword(PASSWORD);
const userId = crypto.randomUUID();

db.insert(schema.users)
	.values({ id: userId, email: EMAIL, name: NAME, password: hash, role: ROLE, is_active: true })
	.run();

if (ROLE === 'buyer') {
	db.insert(schema.buyers).values({ id: userId, company_name: COMPANY }).run();
}

console.log(`✅ ${ROLE === 'buyer' ? 'Buyer' : 'Supplier'} account created:`);
console.log(`   Email:    ${EMAIL}`);
console.log(`   Password: ${PASSWORD}`);
console.log(`   Name:     ${NAME}`);
if (ROLE === 'buyer') console.log(`   Company:  ${COMPANY}`);
console.log(`\nCustomize with env vars: SEED_EMAIL SEED_PASSWORD SEED_NAME SEED_ROLE SEED_COMPANY`);
