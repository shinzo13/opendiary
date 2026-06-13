import { fail, redirect } from '@sveltejs/kit';
import { db, users } from '$lib/server/db';
import { hashPassword, setPendingEmail } from '$lib/server/auth';
import { createVerificationToken } from '$lib/server/verification';
import { sendVerificationEmail } from '$lib/server/mail';
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

		const token = await createVerificationToken(user.id);
		try {
			await sendVerificationEmail(email, token);
		} catch (e) {
			console.error('verification email failed', e);
			return fail(500, { error: 'could not send the confirmation email — try again' });
		}

		setPendingEmail(cookies, email);
		redirect(303, '/verify-pending');
	}
};
