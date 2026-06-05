import { error, redirect } from '@sveltejs/kit';
import { db, entries } from '$lib/server/db';
import { deleteUpload } from '$lib/server/uploads';
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
	return { entry };
};

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		const [entry] = await db
			.select()
			.from(entries)
			.where(and(eq(entries.id, params.id), eq(entries.userId, locals.userId!)))
			.limit(1);

		if (!entry) error(404);

		await db.delete(entries).where(eq(entries.id, params.id));
		await deleteUpload(entry.imageFilename);

		redirect(302, '/home');
	}
};
