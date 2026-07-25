<script lang="ts">
	import { enhance } from '$app/forms';
	import { MOODS, MOOD_CHOICES } from '$lib/diary';
	import Toast from '$lib/components/Toast.svelte';
	import TrackPicker, { type PickedTrack } from '$lib/components/TrackPicker.svelte';
	import PhotoPicker, { photoPayload, type PickedPhoto } from '$lib/components/PhotoPicker.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let track = $state<PickedTrack | null>(null);

	let photos = $state<PickedPhoto[]>([]);
	let saving = $state(false);
	let mood = $state<string | null>(null);
</script>

<div class="page">
	<header>
		<a href="/home" class="back">
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
			const { order, files } = photoPayload(photos);
			formData.set('photo_order', JSON.stringify(order));
			formData.delete('photos');
			for (const file of files) formData.append('photos', file, file.name || 'photo.jpg');
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

			<PhotoPicker bind:photos />

			<textarea
				class="field-body"
				name="body"
				placeholder="what happened..."
			></textarea>

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

			<input type="hidden" name="track_title" value={track?.title ?? ''} />
			<input type="hidden" name="track_artist" value={track?.artist ?? ''} />
			<input type="hidden" name="track_cover" value={track?.cover ?? ''} />
			<TrackPicker bind:track />

		</div>
	</form>
</div>

{#if form?.error}
	{#key form}
		<Toast message={form.error} variant="error" />
	{/key}
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
