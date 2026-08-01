import { db, entries } from '$lib/server/db';
import { photoSummaries } from '$lib/server/photos';
import { eq, desc } from 'drizzle-orm';

// every entry of a user, newest first, with its cover photo and photo count
export async function userEntries(userId: string) {
	const rows = await db
		.select()
		.from(entries)
		.where(eq(entries.userId, userId))
		.orderBy(desc(entries.date), desc(entries.createdAt));

	const summaries = await photoSummaries(rows.map((r) => r.id));

	return rows.map((row) => {
		const photos = summaries.get(row.id);
		return { ...row, coverFilename: photos?.cover ?? '', photoCount: photos?.count ?? 0 };
	});
}
