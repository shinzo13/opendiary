<script lang="ts">
	import { onMount } from 'svelte';
	import { getEntries } from '$lib/db';
	import type { DiaryEntry } from '$lib/types';

	let entries = $state<DiaryEntry[]>([]);
	let imageUrls = $state<Record<string, string>>({});
	let loading = $state(true);

	onMount(async () => {
		entries = await getEntries();
		for (const e of entries) {
			imageUrls[e.id] = URL.createObjectURL(e.imageBlob);
		}
		loading = false;
		return () => {
			for (const url of Object.values(imageUrls)) {
				URL.revokeObjectURL(url);
			}
		};
	});

	function formatDate(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
	}
</script>

<div class="page">
	<header>
		<span class="logo">OpenDiary</span>
		<a href="/new" class="add-btn" aria-label="Новая запись">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</a>
	</header>

	<main>
		{#if loading}
			<div class="empty">загрузка...</div>
		{:else if entries.length === 0}
			<div class="empty">
				<p>пока пусто</p>
				<a href="/new" class="cta">добавить первую запись</a>
			</div>
		{:else}
			<div class="timeline">
				<div class="spine"></div>
				{#each entries as entry, i (entry.id)}
					{@const side = i % 2 === 0 ? 'left' : 'right'}
					<div class="row {side}">
						{#if side === 'left'}
							<div class="spacer">
								<a href="/entry/{entry.id}" class="card">
									<div class="thumb">
										{#if imageUrls[entry.id]}
											<img src={imageUrls[entry.id]} alt={entry.description} />
										{/if}
									</div>
									<div class="info">
										<time>{formatDate(entry.date)}</time>
										<p>{entry.description}</p>
									</div>
								</a>
							</div>
							<div class="node"></div>
							<div class="spacer"></div>
						{:else}
							<div class="spacer"></div>
							<div class="node"></div>
							<div class="spacer">
								<a href="/entry/{entry.id}" class="card">
									<div class="thumb">
										{#if imageUrls[entry.id]}
											<img src={imageUrls[entry.id]} alt={entry.description} />
										{/if}
									</div>
									<div class="info">
										<time>{formatDate(entry.date)}</time>
										<p>{entry.description}</p>
									</div>
								</a>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: var(--bg);
		border-bottom: 1px solid var(--surface2);
	}

	.logo {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.3px;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--accent);
		color: #111;
	}

	main {
		flex: 1;
		padding: 24px 0 60px;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 80px;
		color: var(--text-muted);
		font-size: 16px;
	}

	.cta {
		padding: 12px 24px;
		background: var(--accent);
		color: #111;
		border-radius: var(--radius);
		font-weight: 600;
	}

	/* ── timeline ── */

	.timeline {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.spine {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		transform: translateX(-50%);
		background: var(--surface2);
		z-index: 0;
	}

	.row {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;
		padding: 12px 0;
	}

	/* центральный узел — маленький кружок на линии */
	.node {
		flex-shrink: 0;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--bg);
		z-index: 2;
	}

	/* пустая сторона напротив карточки — переопределено ниже */

	/* ── half-sides ── */

	/* каждая половина занимает ровно 50% минус узел */
	.spacer {
		flex: 1;
		display: flex;
	}

	.row.left .spacer   { justify-content: flex-end; }
	.row.right .spacer  { justify-content: flex-start; }

	/* ── card ── */

	.card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 12px;
		min-width: 0;
		max-width: calc(50vw - 20px);
	}

	/* левая: [текст][картинка] — картинка ближе к центру */
	.row.left .card {
		flex-direction: row-reverse;
	}

	/* правая: [картинка][текст] — картинка ближе к центру */
	.row.right .card {
		flex-direction: row;
	}

	.thumb {
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface2);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.row.left .info  { text-align: right; }
	.row.right .info { text-align: left; }

	time {
		font-size: 11px;
		color: var(--accent);
		font-weight: 600;
		text-transform: lowercase;
	}

	p {
		font-size: 13px;
		line-height: 1.35;
		color: var(--text);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
