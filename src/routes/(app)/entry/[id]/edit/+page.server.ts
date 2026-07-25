import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db, entries } from '$lib/server/db';
import { PhotoError, listPhotos, readPhotoForm, savePhotos } from '$lib/server/photos';
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
	default: async ({ request, params, locals }) => {
		const data = await request.formData();
		const date = data.get('date') as string;
		const description = (data.get('description') as string)?.trim();
		const body = (data.get('body') as string)?.trim() ?? '';
		const mood = ((data.get('mood') as string) || '').trim() || null;
		const trackTitle = ((data.get('track_title') as string) || '').trim() || null;
		const trackArtist = ((data.get('track_artist') as string) || '').trim() || null;
		const trackCover = ((data.get('track_cover') as string) || '').trim() || null;

		let photoForm;
		try {
			photoForm = readPhotoForm(data);
		} catch (err) {
			if (err instanceof PhotoError) return fail(400, { error: err.message });
			throw err;
		}

		if (!description) return fail(400, { error: 'description is required' });
		if (!date) return fail(400, { error: 'date is required' });

		const [current] = await db
			.select()
			.from(entries)
			.where(and(eq(entries.id, params.id), eq(entries.userId, locals.userId!)))
			.limit(1);

		if (!current) error(404);

		// another entry already on that date?
		const [clash] = await db
			.select({ id: entries.id })
			.from(entries)
			.where(
				and(
					eq(entries.userId, locals.userId!),
					eq(entries.date, date),
					ne(entries.id, params.id)
				)
			)
			.limit(1);

		if (clash) return fail(400, { error: 'an entry for this date already exists' });

		try {
			await savePhotos(current.id, photoForm);
		} catch (err) {
			if (err instanceof PhotoError) return fail(400, { error: err.message });
			throw err;
		}

		await db
			.update(entries)
			.set({ date, description, body, mood, trackTitle, trackArtist, trackCover })
			.where(eq(entries.id, params.id));

		redirect(302, `/entry/${params.id}`);
	}
};
