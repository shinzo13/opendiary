<script lang="ts">
	import { MOODS, moodCounts, type Entry } from '$lib/diary';

	let { entries }: { entries: Entry[] } = $props();

	const counts = $derived(moodCounts(entries));
	const max = $derived(counts.length ? Math.max(...counts.map(([, n]) => n)) : 1);
</script>

<div class="panel">
	<div class="head">
		<h3>how it felt</h3>
		<a class="trend" href="/moods">
			<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="3 16 9 10 13 14 21 6" />
			</svg>
			over time
		</a>
	</div>
	{#if counts.length === 0}
		<p class="empty">no moods logged yet</p>
	{:else}
		<div class="rows">
			{#each counts as [m, n], i (m)}
				<div class="row">
					<span class="lbl">{MOODS[m].label}</span>
					<div class="track">
						<div class="bar" style="width: {(n / max) * 100}%; background: {MOODS[m].color}; animation-delay: {i * 65}ms"></div>
						<span class="cnt">{n}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.panel {
		background: color-mix(in oklch, var(--panel) 86%, transparent);
		border: 1px solid color-mix(in oklch, var(--panel-line) 70%, transparent);
		border-radius: 20px;
		padding: 18px;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 16px;
	}
	h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}
	.trend {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex: none;
		padding: 5px 10px;
		border-radius: 999px;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
		font-size: 11px;
		font-weight: 700;
		transition: 0.18s;
	}
	.trend:hover { border-color: var(--accent); color: var(--accent); }
	.empty { font-size: 13px; color: var(--dim); }

	.rows { display: flex; flex-direction: column; gap: 10px; }
	.row {
		display: grid;
		grid-template-columns: 84px 1fr;
		align-items: center;
		gap: 12px;
	}
	.lbl {
		font-size: 12px;
		color: var(--dim);
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.track { display: flex; align-items: center; gap: 8px; }
	.bar {
		height: 10px;
		min-width: 4px;
		border-radius: 5px;
		transition: width 0.3s cubic-bezier(0.2, 0.7, 0.3, 1);
		transform-origin: left;
		animation: bar-grow 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both;
	}

	@keyframes bar-grow {
		from { transform: scaleX(0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.bar { animation: none; }
	}
	.cnt { font-size: 11px; font-weight: 700; color: var(--dim); flex: none; }
</style>
