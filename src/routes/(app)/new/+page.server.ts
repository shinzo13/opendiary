import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, entries } from '$lib/server/db';
import { PhotoError, readPhotoForm, savePhotos } from '$lib/server/photos';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		const [existing] = await db
			.select({ id: entries.id })
			.from(entries)
			.where(and(eq(entries.userId, locals.userId!), eq(entries.date, date)))
			.limit(1);

		if (existing) return fail(400, { error: 'an entry for this date already exists' });

		const [entry] = await db
			.insert(entries)
			.values({
				userId: locals.userId!,
				date,
				description,
				body,
				mood,
				trackTitle,
				trackArtist,
				trackCover
			})
			.returning({ id: entries.id });

		try {
			await savePhotos(entry.id, photoForm);
		} catch (err) {
			await db.delete(entries).where(eq(entries.id, entry.id));
			if (err instanceof PhotoError) return fail(400, { error: err.message });
			throw err;
		}

		redirect(302, '/home');
	}
};
