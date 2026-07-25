import { error, redirect } from '@sveltejs/kit';
import { db, entries } from '$lib/server/db';
import { deletePhotos, listPhotos } from '$lib/server/photos';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	await parent();
	const [entry] = await db
		.select()
		.from(entries)
		.where(and(eq(entries.id, params.id), eq(entries.userId, locals.userId!)))
		.limit(1);

	if (!entry) error(404);
	const photos = await listPhotos(entry.id);
	return { entry, photos: photos.map((p) => p.filename) };
};

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		const [entry] = await db
			.select({ id: entries.id })
			.from(entries)
			.where(and(eq(entries.id, params.id), eq(entries.userId, locals.userId!)))
			.limit(1);

		if (!entry) error(404);

		await deletePhotos(entry.id);
		await db.delete(entries).where(eq(entries.id, params.id));

		redirect(302, '/home');
	}
};
