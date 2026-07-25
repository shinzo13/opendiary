import { asc, eq, inArray } from 'drizzle-orm';
import { db, entryPhotos } from './db';
import { saveUpload, deleteUpload } from './uploads';

export const MAX_PHOTOS = 20;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

// a slot in the submitted order: either a photo already stored on the entry,
// or one of the newly uploaded files (by index in the `photos` file list)
export type PhotoSlot = { kind: 'existing'; filename: string } | { kind: 'new'; index: number };

export type PhotoForm = { slots: PhotoSlot[]; files: File[] };

export class PhotoError extends Error {}

export function readPhotoForm(data: FormData): PhotoForm {
	const files = (data.getAll('photos') as File[]).filter((f) => f instanceof File && f.size > 0);

	for (const file of files) {
		if (!file.type.startsWith('image/')) throw new PhotoError('only images can be uploaded');
		if (file.size > MAX_FILE_BYTES) throw new PhotoError('each photo must be under 15mb');
	}

	let raw: unknown;
	try {
		raw = JSON.parse((data.get('photo_order') as string) || '[]');
	} catch {
		throw new PhotoError('could not read the photo list');
	}
	if (!Array.isArray(raw)) throw new PhotoError('could not read the photo list');

	const slots = raw.map((token): PhotoSlot => {
		if (typeof token !== 'string') throw new PhotoError('could not read the photo list');
		if (token.startsWith('new:')) {
			const index = Number(token.slice(4));
			if (!Number.isInteger(index) || index < 0 || index >= files.length) {
				throw new PhotoError('could not read the photo list');
			}
			return { kind: 'new', index };
		}
		if (token.startsWith('existing:')) {
			return { kind: 'existing', filename: token.slice(9) };
		}
		throw new PhotoError('could not read the photo list');
	});

	if (slots.length === 0) throw new PhotoError('at least one photo is required');
	if (slots.length > MAX_PHOTOS) throw new PhotoError(`up to ${MAX_PHOTOS} photos per entry`);

	return { slots, files };
}

export function listPhotos(entryId: string) {
	return db
		.select({ filename: entryPhotos.filename })
		.from(entryPhotos)
		.where(eq(entryPhotos.entryId, entryId))
		.orderBy(asc(entryPhotos.position));
}

// covers for a batch of entries: entry id -> [cover filename, total count]
export async function photoSummaries(entryIds: string[]) {
	if (entryIds.length === 0) return new Map<string, { cover: string; count: number }>();

	const rows = await db
		.select({ entryId: entryPhotos.entryId, filename: entryPhotos.filename })
		.from(entryPhotos)
		.where(inArray(entryPhotos.entryId, entryIds))
		.orderBy(asc(entryPhotos.entryId), asc(entryPhotos.position));

	const summaries = new Map<string, { cover: string; count: number }>();
	for (const row of rows) {
		const found = summaries.get(row.entryId);
		if (found) found.count++;
		else summaries.set(row.entryId, { cover: row.filename, count: 1 });
	}
	return summaries;
}

// writes the submitted order as the entry's photo list: new files are stored,
// existing photos left out of the order are dropped from disk
export async function savePhotos(entryId: string, form: PhotoForm) {
	const current = await listPhotos(entryId);
	const known = new Set(current.map((p) => p.filename));

	const filenames: string[] = [];
	const stored: string[] = [];
	try {
		for (const slot of form.slots) {
			if (slot.kind === 'existing') {
				if (!known.has(slot.filename)) throw new PhotoError('could not read the photo list');
				filenames.push(slot.filename);
			} else {
				const filename = await saveUpload(form.files[slot.index]);
				stored.push(filename);
				filenames.push(filename);
			}
		}
	} catch (err) {
		await Promise.all(stored.map(deleteUpload));
		throw err;
	}

	await db.transaction(async (tx) => {
		await tx.delete(entryPhotos).where(eq(entryPhotos.entryId, entryId));
		await tx.insert(entryPhotos).values(
			filenames.map((filename, position) => ({ entryId, filename, position }))
		);
	});

	const kept = new Set(filenames);
	await Promise.all(current.filter((p) => !kept.has(p.filename)).map((p) => deleteUpload(p.filename)));
}

export async function deletePhotos(entryId: string) {
	const photos = await listPhotos(entryId);
	await db.delete(entryPhotos).where(eq(entryPhotos.entryId, entryId));
	await Promise.all(photos.map((p) => deleteUpload(p.filename)));
}
