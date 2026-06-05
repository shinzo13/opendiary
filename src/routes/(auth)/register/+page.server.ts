import { fail, redirect } from '@sveltejs/kit';
import { db, users } from '$lib/server/db';
import { hashPassword, createToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.userId) redirect(302, '/home');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;

		if (!email || !password) return fail(400, { error: 'fill in all fields' });
		if (password.length < 8) return fail(400, { error: 'password must be at least 8 characters' });

		const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existing) return fail(400, { error: 'this email is already registered' });

		const [user] = await db
			.insert(users)
			.values({ email, passwordHash: await hashPassword(password) })
			.returning();

		cookies.set('token', createToken(user.id), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.HTTPS === '1',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(302, '/home?welcome=1');
	}
};
