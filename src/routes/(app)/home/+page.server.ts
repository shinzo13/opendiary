import { userEntries } from '$lib/server/entries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();

	return {
		entries: await userEntries(locals.userId!),
		welcome: url.searchParams.has('welcome')
	};
};
