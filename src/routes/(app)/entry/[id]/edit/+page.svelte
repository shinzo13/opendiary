<script lang="ts">
	import { enhance } from '$app/forms';
	import { MOODS, MOOD_CHOICES } from '$lib/diary';
	import Cropper from '$lib/components/Cropper.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let imagePreview = $state<string | null>(`/api/uploads/${data.entry.imageFilename}`);
	let croppedFile = $state<File | null>(null);
	let rawSrc = $state<string | null>(null);
	let cropping = $state(false);
	let saving = $state(false);
	let mood = $state<string | null>(data.entry.mood);

	function loadImageFile(file: File) {
		if (rawSrc) URL.revokeObjectURL(rawSrc);
		rawSrc = URL.createObjectURL(file);
		cropping = true;
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		loadImageFile(file);
		input.value = '';
	}

	function onPaste(e: ClipboardEvent) {
		const file = [...(e.clipboardData?.items ?? [])]
			.find((i) => i.type.startsWith('image/'))
			?.getAsFile();
		if (!file) return;
		e.preventDefault();
		loadImageFile(file);
	}

	function onCropConfirm(file: File) {
		croppedFile = file;
		if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
		imagePreview = URL.createObjectURL(file);
		closeCropper();
	}

	function closeCropper() {
		cropping = false;
		if (rawSrc) URL.revokeObjectURL(rawSrc);
		rawSrc = null;
	}
</script>

<svelte:window onpaste={onPaste} />

<div class="page">
	<header>
		<a href="/entry/{data.entry.id}" class="back">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		<button class="save" form="entry-form" type="submit" disabled={saving}>
			{saving ? '...' : 'save'}
		</button>
	</header>

	<form
		id="entry-form"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={({ formData }) => {
			if (croppedFile) formData.set('image', croppedFile, 'photo.jpg');
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		<div class="fields">
			<input class="field-date" type="date" name="date" value={data.entry.date} />

			<input
				class="field-title"
				type="text"
				name="description"
				placeholder="description"
				maxlength="120"
				autocomplete="off"
				value={data.entry.description}
			/>

			<label class="photo-btn" class:has-image={!!imagePreview}>
				{#if imagePreview}
					<img src={imagePreview} alt="photo" />
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<polyline points="21 15 16 10 5 21"/>
					</svg>
					<span>add photo</span>
				{/if}
				<input type="file" accept="image/*" onchange={onFileChange} />
			</label>
			<span class="photo-hint">tap the photo to replace it</span>

			<textarea class="field-body" name="body" placeholder="what happened...">{data.entry.body}</textarea>

			<input type="hidden" name="mood" value={mood ?? ''} />
			<div class="mood-label">how it felt</div>
			<div class="chips">
				{#each MOOD_CHOICES as m (m)}
					<button
						type="button"
						class="chip"
						class:on={mood === m}
						onclick={() => (mood = mood === m ? null : m)}
					>
						<i style="background: {MOODS[m].color}"></i>{MOODS[m].label}
					</button>
				{/each}
			</div>

		</div>
	</form>
</div>

{#if form?.error}
	{#key form}
		<Toast message={form.error} variant="error" />
	{/key}
{/if}

{#if cropping && rawSrc}
	<Cropper src={rawSrc} onconfirm={onCropConfirm} oncancel={closeCropper} />
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		background: var(--bg);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 20px;
	}

	.back { display: flex; align-items: center; color: var(--text-muted); padding: 4px; }

	.save {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 15px;
		font-weight: 600;
	}

	.save:disabled { opacity: 0.4; }

	form { flex: 1; }

	.fields {
		display: flex;
		flex-direction: column;
		padding: 4px 20px 40px;
	}

	.field-date {
		background: none;
		border: none;
		border-bottom: 1px solid var(--surface2);
		color: var(--text-muted);
		font-family: var(--font);
		font-size: 13px;
		padding: 14px 0;
		outline: none;
		width: 100%;
		-webkit-appearance: none;
	}

	.field-title {
		background: none;
		border: none;
		border-bottom: 1px solid var(--surface2);
		color: var(--text);
		font-family: var(--font);
		font-size: 20px;
		font-weight: 600;
		padding: 16px 0;
		outline: none;
		width: 100%;
	}

	.field-title::placeholder { color: var(--surface2); }

	.photo-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
		border-radius: 8px;
		background: var(--surface);
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		margin: 12px 0 8px;
		border: 1px solid var(--surface2);
	}

	.photo-btn input[type="file"] { display: none; }

	.photo-btn.has-image {
		padding: 0;
		border-radius: 14px;
		overflow: hidden;
		border: none;
		width: 100%;
		max-width: 360px;
		aspect-ratio: 1 / 1;
		margin: 12px 0 6px;
	}

	.photo-btn.has-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.photo-hint { font-size: 12px; color: var(--dimmer); margin-bottom: 4px; }

	.field-body {
		background: none;
		border: none;
		color: var(--text);
		font-family: var(--font);
		font-size: 15px;
		line-height: 1.7;
		padding: 16px 0;
		outline: none;
		width: 100%;
		resize: none;
		min-height: 180px;
	}

	.field-body::placeholder { color: var(--surface2); }

	.mood-label {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--dim);
		margin: 8px 0 10px;
	}

	.chips { display: flex; flex-wrap: wrap; gap: 8px; }

	.chips .chip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 13px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--card);
		color: var(--dim);
		font-size: 13px;
		font-family: inherit;
		cursor: pointer;
		transition: 0.15s;
	}

	.chips .chip i { width: 9px; height: 9px; border-radius: 50%; }

	.chips .chip.on {
		color: var(--text);
		border-color: color-mix(in oklch, var(--accent) 60%, transparent);
		background: var(--accent-soft);
	}

	/* ── desktop ── */
	@media (min-width: 768px) {
		form {
			width: 100%;
			max-width: 560px;
			margin: 0 auto;
		}

		.save { font-size: 16px; }

		.field-date { font-size: 14px; }
		.field-title { font-size: 24px; }
		.field-body { font-size: 16px; }
	}
</style>
