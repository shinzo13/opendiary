<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let imagePreview = $state<string | null>(null);
	let saving = $state(false);

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (imagePreview) URL.revokeObjectURL(imagePreview);
		imagePreview = URL.createObjectURL(file);
	}
</script>

<div class="page">
	<header>
		<a href="/" class="back">
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
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		<div class="fields">
			<input class="field-date" type="date" name="date" value={new Date().toISOString().slice(0, 10)} />

			<input
				class="field-title"
				type="text"
				name="description"
				placeholder="description"
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
					<span>add photo</span>
				{/if}
				<input type="file" name="image" accept="image/*" onchange={onFileChange} />
			</label>

			<textarea
				class="field-body"
				name="body"
				placeholder="what happened..."
			></textarea>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
		</div>
	</form>
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
		border-radius: 10px;
		overflow: hidden;
		border: none;
		width: 100%;
		aspect-ratio: 4/3;
		margin: 12px 0;
	}

	.photo-btn.has-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

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

	.error { font-size: 13px; color: #ff6b6b; margin-top: 4px; }

	/* ── desktop ── */
	@media (min-width: 768px) {
		header, form {
			width: 100%;
			max-width: 560px;
			margin: 0 auto;
		}

		.save { font-size: 16px; }

		.field-date { font-size: 14px; }
		.field-title { font-size: 24px; }
		.field-body { font-size: 16px; }

		.photo-btn.has-image {
			aspect-ratio: auto;
			max-height: 60vh;
		}

		.photo-btn.has-image img {
			height: auto;
			max-height: 60vh;
			object-fit: contain;
			background: #000;
		}
	}
</style>
