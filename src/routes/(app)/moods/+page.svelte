<script lang="ts">
	import MoodTrend from '$lib/components/MoodTrend.svelte';
	import { moodSeries, type Entry } from '$lib/diary';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const entries = $derived(data.entries as Entry[]);
	const days = $derived(moodSeries(entries).length);
</script>

<div class="page">
	<header>
		<a href="/home" class="back" aria-label="back">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		<span class="title">mood over time</span>
		<span class="spacer"></span>
	</header>

	<main>
		<p class="lede">
			{#if days > 0}
				{days} {days === 1 ? 'day' : 'days'} logged — swipe left to walk back through them.
			{:else}
				nothing to plot yet.
			{/if}
		</p>

		<section class="panel">
			<MoodTrend {entries} />
		</section>
	</main>
</div>

<style>
	.page { min-height: 100dvh; background: var(--bg); }

	header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 20px;
	}

	.back { display: flex; align-items: center; color: var(--dim); padding: 4px; }
	.title { font-size: 16px; font-weight: 700; }
	.spacer { flex: 1; }

	main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 4px 20px 48px;
		max-width: 980px;
		margin: 0 auto;
		width: 100%;
	}

	.lede { font-size: 13px; color: var(--dim); }

	.panel {
		background: color-mix(in oklch, var(--panel) 86%, transparent);
		border: 1px solid color-mix(in oklch, var(--panel-line) 70%, transparent);
		border-radius: 20px;
		padding: 18px 18px 16px;
	}

	@media (min-width: 768px) {
		header { padding: 18px 32px; }
		main { padding: 4px 32px 60px; }
	}
</style>
