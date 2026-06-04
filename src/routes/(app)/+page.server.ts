import { db, entries } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();

	const rows = await db
		.select()
		.from(entries)
		.where(eq(entries.userId, locals.userId!))
		.orderBy(desc(entries.date), desc(entries.createdAt));

	return { entries: rows, welcome: url.searchParams.has('welcome') };
};
