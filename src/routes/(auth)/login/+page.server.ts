import { fail, redirect } from '@sveltejs/kit';
import { db, users } from '$lib/server/db';
import { verifyPassword, setSessionCookie, setPendingEmail } from '$lib/server/auth';
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

		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { error: 'invalid email or password' });
		}

		if (!user.emailVerified) {
			setPendingEmail(cookies, email);
			redirect(303, '/verify-pending');
		}

		setSessionCookie(cookies, user.id);
		redirect(302, '/home');
	}
};
