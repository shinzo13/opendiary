import { describe, it, expect } from 'vitest';
import { readPhotoForm, PhotoError, MAX_PHOTOS } from './photos';

function image(name = 'a.jpg', bytes = 10) {
	return new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' });
}

function form(order: unknown, files: File[] = []) {
	const data = new FormData();
	data.set('photo_order', JSON.stringify(order));
	for (const file of files) data.append('photos', file);
	return data;
}

describe('readPhotoForm', () => {
	it('keeps the submitted order of new and existing photos', () => {
		const { slots } = readPhotoForm(
			form(['existing:old.jpg', 'new:1', 'new:0'], [image('a.jpg'), image('b.jpg')])
		);
		expect(slots).toEqual([
			{ kind: 'existing', filename: 'old.jpg' },
			{ kind: 'new', index: 1 },
			{ kind: 'new', index: 0 }
		]);
	});

	it('drops empty file inputs so indexes still line up', () => {
		const { files } = readPhotoForm(form(['new:0'], [image(), new File([], '')]));
		expect(files).toHaveLength(1);
	});

	it('rejects an empty photo list', () => {
		expect(() => readPhotoForm(form([]))).toThrow(PhotoError);
	});

	it('rejects more photos than the cap', () => {
		const order = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => `existing:${i}.jpg`);
		expect(() => readPhotoForm(form(order))).toThrow(PhotoError);
	});

	it('rejects a new: token pointing past the uploaded files', () => {
		expect(() => readPhotoForm(form(['new:2'], [image()]))).toThrow(PhotoError);
	});

	it('rejects unknown tokens and malformed json', () => {
		expect(() => readPhotoForm(form(['whatever']))).toThrow(PhotoError);
		const bad = new FormData();
		bad.set('photo_order', '{oops');
		expect(() => readPhotoForm(bad)).toThrow(PhotoError);
	});

	it('rejects non-image uploads', () => {
		const file = new File(['x'], 'note.txt', { type: 'text/plain' });
		expect(() => readPhotoForm(form(['new:0'], [file]))).toThrow(PhotoError);
	});

	it('rejects a file over the size limit', () => {
		const huge = image('big.jpg', 16 * 1024 * 1024);
		expect(() => readPhotoForm(form(['new:0'], [huge]))).toThrow(PhotoError);
	});
});
