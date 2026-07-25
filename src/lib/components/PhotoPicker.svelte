<script module lang="ts">
	// a photo in the picker: either already stored on the entry (filename) or
	// freshly picked in the browser (file)
	export type PickedPhoto = {
		key: string;
		url: string;
		file: File | null;
		filename: string | null;
	};

	export const MAX_PHOTOS = 20;

	const MAX_EDGE = 2048;

	// shrink oversized photos in the browser: uploads stay quick and the disk
	// does not fill up with 12mp originals
	async function downscale(file: File): Promise<File> {
		try {
			const bitmap = await createImageBitmap(file);
			const scale = MAX_EDGE / Math.max(bitmap.width, bitmap.height);
			if (scale >= 1) {
				bitmap.close();
				return file;
			}
			const canvas = document.createElement('canvas');
			canvas.width = Math.round(bitmap.width * scale);
			canvas.height = Math.round(bitmap.height * scale);
			const ctx = canvas.getContext('2d');
			if (!ctx) return file;
			ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			bitmap.close();
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/jpeg', 0.88)
			);
			if (!blob) return file;
			return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
		} catch {
			return file; // unsupported format — let the server take it as-is
		}
	}

	export function storedPhoto(filename: string): PickedPhoto {
		return { key: filename, url: `/api/uploads/${filename}`, file: null, filename };
	}

	// order tokens + the matching file list, as the server action expects them
	export function photoPayload(photos: PickedPhoto[]) {
		const files: File[] = [];
		const order = photos.map((photo) => {
			if (!photo.file) return `existing:${photo.filename}`;
			files.push(photo.file);
			return `new:${files.length - 1}`;
		});
		return { order, files };
	}
</script>

<script lang="ts">
	import Cropper from './Cropper.svelte';

	let { photos = $bindable() }: { photos: PickedPhoto[] } = $props();

	let cropSrc = $state<string | null>(null);
	let cropTarget = $state<'cover' | 'new'>('new');
	let notice = $state<string | null>(null);
	let busy = $state(false);

	function pickedPhoto(file: File): PickedPhoto {
		return {
			key: crypto.randomUUID(),
			url: URL.createObjectURL(file),
			file,
			filename: null
		};
	}

	function release(photo: PickedPhoto) {
		if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
	}

	function openCropper(file: File, target: 'cover' | 'new') {
		if (cropSrc) URL.revokeObjectURL(cropSrc);
		cropSrc = URL.createObjectURL(file);
		cropTarget = target;
	}

	function closeCropper() {
		if (cropSrc) URL.revokeObjectURL(cropSrc);
		cropSrc = null;
	}

	async function addFiles(files: File[]) {
		const images = files.filter((f) => f.type.startsWith('image/'));
		if (images.length === 0) return;

		const room = MAX_PHOTOS - photos.length;
		if (room <= 0) {
			notice = `up to ${MAX_PHOTOS} photos`;
			return;
		}
		notice = images.length > room ? `up to ${MAX_PHOTOS} photos` : null;

		const accepted = images.slice(0, room);
		// the first photo of an empty entry becomes the cover — crop it to square
		const cropFirst = photos.length === 0;
		const rest = cropFirst ? accepted.slice(1) : accepted;

		busy = true;
		const shrunk = await Promise.all(rest.map(downscale));
		busy = false;

		photos = [...photos, ...shrunk.map(pickedPhoto)];
		if (cropFirst) openCropper(accepted[0], 'new');
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		addFiles([...(input.files ?? [])]);
		input.value = ''; // allow re-picking the same file
	}

	function onPaste(e: ClipboardEvent) {
		const pasted = [...(e.clipboardData?.items ?? [])]
			.filter((i) => i.type.startsWith('image/'))
			.map((i) => i.getAsFile())
			.filter((f): f is File => !!f);
		if (pasted.length === 0) return;
		e.preventDefault();
		addFiles(pasted);
	}

	function onCropConfirm(file: File) {
		const cropped = pickedPhoto(file);
		if (cropTarget === 'cover' && photos.length > 0) {
			release(photos[0]);
			photos = [cropped, ...photos.slice(1)];
		} else {
			photos = [cropped, ...photos];
		}
		closeCropper();
	}

	async function recropCover() {
		const cover = photos[0];
		if (!cover) return;
		if (cover.file) {
			openCropper(cover.file, 'cover');
			return;
		}
		const res = await fetch(cover.url);
		openCropper(new File([await res.blob()], 'photo.jpg', { type: 'image/jpeg' }), 'cover');
	}

	function makeCover(index: number) {
		if (index === 0) return;
		photos = [photos[index], ...photos.filter((_, i) => i !== index)];
	}

	function remove(index: number) {
		release(photos[index]);
		photos = photos.filter((_, i) => i !== index);
		notice = null;
	}
</script>

<svelte:window onpaste={onPaste} />

<div class="picker">
	{#if photos.length === 0}
		<label class="add-btn">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18" rx="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<polyline points="21 15 16 10 5 21" />
			</svg>
			<span>{busy ? 'adding photos...' : 'add photos'}</span>
			<input type="file" accept="image/*" multiple onchange={onFileChange} />
		</label>
	{:else}
		<div class="grid">
			{#each photos as photo, i (photo.key)}
				<div class="tile" class:cover={i === 0}>
					<img src={photo.url} alt="" />
					{#if i === 0}
						<span class="badge">cover</span>
						<button type="button" class="corner crop" onclick={recropCover} aria-label="crop the cover">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M6 2v14a2 2 0 0 0 2 2h14" />
								<path d="M18 22V8a2 2 0 0 0-2-2H2" />
							</svg>
						</button>
					{:else}
						<button type="button" class="pick" onclick={() => makeCover(i)} aria-label="make this the cover">
							<span>make cover</span>
						</button>
					{/if}
					<button type="button" class="corner remove" onclick={() => remove(i)} aria-label="remove photo">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			{/each}

			{#if photos.length < MAX_PHOTOS}
				<label class="tile add-tile">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					<input type="file" accept="image/*" multiple onchange={onFileChange} />
				</label>
			{/if}
		</div>

		<span class="hint">
			{#if busy}adding photos...{:else if notice}{notice}{:else if photos.length > 1}{photos.length} photos · the cover is what shows on the timeline{:else}the cover is what shows on the timeline{/if}
		</span>
	{/if}
</div>

{#if cropSrc}
	<Cropper src={cropSrc} onconfirm={onCropConfirm} oncancel={closeCropper} />
{/if}

<style>
	.picker { display: flex; flex-direction: column; margin: 12px 0 8px; }

	.add-btn {
		display: inline-flex;
		align-self: flex-start;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
		border-radius: 8px;
		background: var(--surface);
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		border: 1px solid var(--surface2);
	}

	input[type='file'] { display: none; }

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		max-width: 360px;
	}

	.tile {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: 12px;
		overflow: hidden;
		background: var(--surface);
	}

	.tile img { width: 100%; height: 100%; object-fit: cover; display: block; }

	.tile.cover {
		grid-column: span 3;
		border-radius: 14px;
	}

	.badge {
		position: absolute;
		left: 8px;
		bottom: 8px;
		padding: 3px 8px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
		color: #fff;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.corner {
		position: absolute;
		top: 6px;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
		color: #fff;
		cursor: pointer;
	}

	.corner.remove { right: 6px; }
	.corner.crop { right: 34px; }

	/* tapping a non-cover tile promotes it; the label only shows on hover/focus */
	.pick {
		position: absolute;
		inset: 0;
		border: none;
		background: transparent;
		color: #fff;
		font-family: inherit;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.18s;
	}
	.pick span {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.6);
	}
	.pick:hover, .pick:focus-visible { opacity: 1; }

	.add-tile {
		display: grid;
		place-items: center;
		border: 1px dashed var(--surface2);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.hint { font-size: 12px; color: var(--dimmer); margin-top: 8px; }

	@media (min-width: 768px) {
		.grid { max-width: 420px; }
	}
</style>
