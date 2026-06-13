import { redirect } from '@sveltejs/kit';
import { consumeVerificationToken } from '$lib/server/verification';
import { setSessionCookie, clearPendingEmail } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	if (!token) redirect(303, '/verify-pending?error=invalid');

	const result = await consumeVerificationToken(token);
	if (!result.ok) redirect(303, `/verify-pending?error=${result.reason}`);

	clearPendingEmail(cookies);
	setSessionCookie(cookies, result.userId);
	redirect(303, '/home?welcome=1');
};
