<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getEntry, deleteEntry } from '$lib/db';
	import type { DiaryEntry } from '$lib/types';

	let entry = $state<DiaryEntry | null>(null);
	let imageUrl = $state<string | null>(null);
	let loading = $state(true);
	let confirmDelete = $state(false);

	onMount(async () => {
		const id = page.params.id;
		entry = (await getEntry(id)) ?? null;
		if (entry) {
			imageUrl = URL.createObjectURL(entry.imageBlob);
		}
		loading = false;
		return () => {
			if (imageUrl) URL.revokeObjectURL(imageUrl);
		};
	});

	async function remove() {
		if (!entry) return;
		await deleteEntry(entry.id);
		goto('/');
	}

	function formatDate(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}
</script>

<div class="page">
	<header>
		<a href="/" class="back-btn" aria-label="назад">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		{#if entry}
			<button class="delete-btn" onclick={() => (confirmDelete = true)} aria-label="удалить">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
					<path d="M10 11v6M14 11v6" />
					<path d="M9 6V4h6v2" />
				</svg>
			</button>
		{/if}
	</header>

	{#if loading}
		<div class="centered">загрузка...</div>
	{:else if !entry}
		<div class="centered">запись не найдена</div>
	{:else}
		<div class="hero">
			{#if imageUrl}
				<img src={imageUrl} alt={entry.description} />
			{/if}
		</div>

		<article>
			<time class="date">{formatDate(entry.date)}</time>
			<h1 class="description">{entry.description}</h1>
			{#if entry.body}
				<div class="body">{entry.body}</div>
			{/if}
		</article>
	{/if}
</div>

{#if confirmDelete}
	<div class="overlay" role="dialog" aria-modal="true">
		<div class="dialog">
			<p>удалить эту запись?</p>
			<div class="dialog-actions">
				<button class="btn-cancel" onclick={() => (confirmDelete = false)}>отмена</button>
				<button class="btn-delete" onclick={remove}>удалить</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
	}

	.back-btn,
	.delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		border: none;
		color: #fff;
	}

	.hero {
		width: 100%;
		aspect-ratio: 1/1;
		overflow: hidden;
		background: var(--surface);
	}

	.hero img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	article {
		flex: 1;
		padding: 24px 20px 48px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.date {
		font-size: 12px;
		color: var(--accent);
		font-weight: 600;
		text-transform: lowercase;
	}

	.description {
		font-size: 20px;
		font-weight: 700;
		line-height: 1.3;
	}

	.body {
		font-size: 15px;
		line-height: 1.7;
		color: #ccc;
		white-space: pre-wrap;
		margin-top: 4px;
	}

	.centered {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: var(--text-muted);
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: flex-end;
		z-index: 100;
		padding: 20px;
	}

	.dialog {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 24px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.dialog p {
		font-size: 16px;
		text-align: center;
	}

	.dialog-actions {
		display: flex;
		gap: 12px;
	}

	.btn-cancel,
	.btn-delete {
		flex: 1;
		padding: 14px;
		border-radius: var(--radius);
		border: none;
		font-size: 15px;
		font-weight: 600;
	}

	.btn-cancel {
		background: var(--surface2);
		color: var(--text);
	}

	.btn-delete {
		background: #ff6b6b;
		color: #fff;
	}
</style>
