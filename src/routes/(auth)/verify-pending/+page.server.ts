import { fail, redirect } from '@sveltejs/kit';
import { db, users } from '$lib/server/db';
import { createVerificationToken } from '$lib/server/verification';
import { sendVerificationEmail } from '$lib/server/mail';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, cookies, url }) => {
	if (locals.userId) redirect(302, '/home');
	const email = cookies.get('pending_email') ?? null;
	if (!email) redirect(303, '/login');
	return { email, error: url.searchParams.get('error') };
};

export const actions: Actions = {
	resend: async ({ cookies }) => {
		const email = cookies.get('pending_email');
		if (!email) redirect(303, '/login');

		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (user && !user.emailVerified) {
			const token = await createVerificationToken(user.id);
			try {
				await sendVerificationEmail(email, token);
			} catch (e) {
				console.error('verification email failed', e);
				return fail(500, { error: 'could not send the email — try again' });
			}
		}
		return { sent: true };
	}
};
