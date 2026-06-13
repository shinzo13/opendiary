import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, users, emailVerifications } from './db';

const TTL_MS = 1000 * 60 * 60 * 24;

export async function createVerificationToken(userId: string): Promise<string> {
	const token = randomBytes(32).toString('hex');
	await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
	await db.insert(emailVerifications).values({
		userId,
		token,
		expiresAt: new Date(Date.now() + TTL_MS)
	});
	return token;
}

type ConsumeResult = { ok: true; userId: string } | { ok: false; reason: 'invalid' | 'expired' };

export async function consumeVerificationToken(token: string): Promise<ConsumeResult> {
	const [row] = await db
		.select()
		.from(emailVerifications)
		.where(eq(emailVerifications.token, token))
		.limit(1);

	if (!row) return { ok: false, reason: 'invalid' };

	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(emailVerifications).where(eq(emailVerifications.id, row.id));
		return { ok: false, reason: 'expired' };
	}

	await db.update(users).set({ emailVerified: true }).where(eq(users.id, row.userId));
	await db.delete(emailVerifications).where(eq(emailVerifications.userId, row.userId));
	return { ok: true, userId: row.userId };
}
