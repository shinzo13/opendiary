import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createToken, verifyToken } from './auth';

describe('password hashing', () => {
	it('verifies a correct password against its hash', async () => {
		const hash = await hashPassword('correct horse battery staple');
		expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
	});

	it('rejects a wrong password', async () => {
		const hash = await hashPassword('s3cret');
		expect(await verifyPassword('wrong', hash)).toBe(false);
	});

	it('produces a hash that is not the plaintext', async () => {
		const hash = await hashPassword('plaintext');
		expect(hash).not.toBe('plaintext');
	});
});

describe('session tokens', () => {
	it('round-trips a userId through sign/verify', () => {
		const token = createToken('user-123');
		expect(verifyToken(token)).toMatchObject({ userId: 'user-123' });
	});

	it('returns null for a malformed token', () => {
		expect(verifyToken('not.a.jwt')).toBeNull();
	});

	it('returns null for a token signed with another secret', () => {
		// a structurally valid JWT signed with a different key
		const foreign =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ4In0.' +
			'aW52YWxpZHNpZ25hdHVyZXZhbHVlc3RyaW5nMDAwMDAwMDAw';
		expect(verifyToken(foreign)).toBeNull();
	});
});
