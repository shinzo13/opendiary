import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db, entries } from '$lib/server/db';
import { saveUpload, deleteUpload } from '$lib/server/uploads';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	await parent();
	const [entry] = await db
		.select()
		.from(entries)
		.where(and(eq(entries.id, params.id), eq(entries.userId, locals.userId!)))
		.limit(1);

	if (!entry) error(404);
	return { entry };
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
		const image = data.get('image') as File;

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

		let imageFilename = current.imageFilename;
		if (image && image.size > 0) {
			imageFilename = await saveUpload(image);
		}

		await db
			.update(entries)
			.set({ date, description, body, mood, imageFilename, trackTitle, trackArtist, trackCover })
			.where(eq(entries.id, params.id));

		if (imageFilename !== current.imageFilename) await deleteUpload(current.imageFilename);

		redirect(302, `/entry/${params.id}`);
	}
};
