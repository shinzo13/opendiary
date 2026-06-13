import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Cookies } from '@sveltejs/kit';

const JWT_SECRET = process.env.JWT_SECRET!;

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function createToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string } | null {
	try {
		return jwt.verify(token, JWT_SECRET) as { userId: string };
	} catch {
		return null;
	}
}

export function setSessionCookie(cookies: Cookies, userId: string) {
	cookies.set('token', createToken(userId), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.HTTPS === '1',
		maxAge: 60 * 60 * 24 * 30
	});
}

export function setPendingEmail(cookies: Cookies, email: string) {
	cookies.set('pending_email', email, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.HTTPS === '1',
		maxAge: 60 * 30
	});
}

export function clearPendingEmail(cookies: Cookies) {
	cookies.delete('pending_email', { path: '/' });
}
