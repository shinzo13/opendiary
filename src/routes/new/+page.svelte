<script lang="ts">
	import { goto } from '$app/navigation';
	import { saveEntry } from '$lib/db';
	import type { DiaryEntry } from '$lib/types';

	let date = $state(new Date().toISOString().slice(0, 10));
	let description = $state('');
	let body = $state('');
	let imageFile = $state<File | null>(null);
	let imagePreview = $state<string | null>(null);
	let saving = $state(false);
	let error = $state('');

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		imageFile = file;
		if (imagePreview) URL.revokeObjectURL(imagePreview);
		imagePreview = URL.createObjectURL(file);
	}

	async function submit() {
		error = '';
		if (!imageFile) { error = 'нужно добавить фото'; return; }
		if (!description.trim()) { error = 'нужно описание'; return; }
		saving = true;
		try {
			await saveEntry({
				id: crypto.randomUUID(),
				date,
				description: description.trim(),
				body: body.trim(),
				imageBlob: imageFile,
				createdAt: Date.now()
			} satisfies DiaryEntry);
			goto('/');
		} catch {
			error = 'ошибка при сохранении';
			saving = false;
		}
	}
</script>

<div class="page">
	<header>
		<a href="/" class="back">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		<button class="save" onclick={submit} disabled={saving}>
			{saving ? '...' : 'сохранить'}
		</button>
	</header>

	<div class="content">
		<!-- поля -->
		<div class="fields">
			<input
				class="field-date"
				type="date"
				bind:value={date}
			/>

			<input
				class="field-title"
				type="text"
				bind:value={description}
				placeholder="описание"
				maxlength="120"
				autocomplete="off"
			/>

			<label class="photo-btn" class:has-image={!!imagePreview}>
				{#if imagePreview}
					<img src={imagePreview} alt="фото" />
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<polyline points="21 15 16 10 5 21"/>
					</svg>
					<span>добавить фото</span>
				{/if}
				<input type="file" accept="image/*" onchange={onFileChange} />
			</label>

			<textarea
				class="field-body"
				bind:value={body}
				placeholder="что произошло..."
			></textarea>

			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	</div>
</div>

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

	.back {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		padding: 4px;
	}

	.save {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 15px;
		font-weight: 600;
		padding: 4px 0;
	}

	.save:disabled { opacity: 0.4; }

	/* ── поля ── */

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

	/* ── фото ── */

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
		margin: 4px 0 8px;
		border: 1px solid var(--surface2);
	}

	.photo-btn input[type="file"] { display: none; }

	.photo-btn.has-image {
		padding: 0;
		border-radius: 10px;
		overflow: hidden;
		border: none;
		width: 100%;
		aspect-ratio: 4/3;
	}

	.photo-btn.has-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.error {
		font-size: 13px;
		color: #ff6b6b;
		margin-top: 4px;
	}
</style>
