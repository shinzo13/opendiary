import { db, entries } from '$lib/server/db';
import { photoSummaries } from '$lib/server/photos';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();

	const rows = await db
		.select()
		.from(entries)
		.where(eq(entries.userId, locals.userId!))
		.orderBy(desc(entries.date), desc(entries.createdAt));

	const summaries = await photoSummaries(rows.map((r) => r.id));

	const withPhotos = rows.map((row) => {
		const photos = summaries.get(row.id);
		return { ...row, coverFilename: photos?.cover ?? '', photoCount: photos?.count ?? 0 };
	});

	return { entries: withPhotos, welcome: url.searchParams.has('welcome') };
};
