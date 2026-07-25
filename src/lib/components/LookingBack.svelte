<script lang="ts">
	import { fmtShort, parseDate, type Entry } from '$lib/diary';

	let { entries }: { entries: Entry[] } = $props();

	const today = new Date();
	// an entry from this same calendar day in an earlier year, if any
	const onThisDay = $derived(
		entries.find((e) => {
			const d = parseDate(e.date);
			return (
				d.getMonth() === today.getMonth() &&
				d.getDate() === today.getDate() &&
				d.getFullYear() < today.getFullYear()
			);
		})
	);
	const reel = $derived(entries.slice(0, 3));
</script>

<div class="panel">
	<h3>looking back</h3>
	{#if onThisDay}
		<a class="lb-hit" href="/entry/{onThisDay.id}">
			<div class="lb-thumb"><img src="/api/uploads/{onThisDay.coverFilename}" alt={onThisDay.description} /></div>
			<div class="lb-meta">
				<div class="d">on this day, {parseDate(onThisDay.date).getFullYear()}</div>
				<div class="c">{onThisDay.description}</div>
			</div>
		</a>
	{:else}
		<div class="lb-empty">
			on this day <span class="serif">last year</span>, opendiary was still empty. give it time — a year from now this corner fills up.
		</div>
	{/if}

	<h3 class="reel-h">recent moments</h3>
	<div class="reel">
		{#each reel as e (e.id)}
			<a class="reel-item" href="/entry/{e.id}">
				<div class="reel-thumb"><img src="/api/uploads/{e.coverFilename}" alt={e.description} /></div>
				<div class="reel-meta">
					<div class="d">{fmtShort(e.date)}</div>
					<div class="c">{e.description}</div>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.panel {
		background: color-mix(in oklch, var(--panel) 86%, transparent);
		border: 1px solid color-mix(in oklch, var(--panel-line) 70%, transparent);
		border-radius: 20px;
		padding: 18px;
	}
	h3 {
		margin: 0 0 14px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}
	.reel-h { margin: 20px 0 12px; }
	.lb-empty { font-size: 13px; color: var(--dim); line-height: 1.5; }
	.lb-empty .serif { font-family: var(--serif); font-style: italic; color: var(--text); }
	.lb-hit, .reel-item {
		display: flex; gap: 11px; align-items: center; cursor: pointer;
		border-radius: 12px; padding: 6px; margin: -6px; transition: background 0.18s;
	}
	.lb-hit:hover, .reel-item:hover { background: var(--card); }
	.lb-thumb, .reel-thumb {
		width: 46px; height: 46px; border-radius: 11px; flex: none; overflow: hidden; background: var(--card);
	}
	.lb-thumb img, .reel-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.lb-meta .d, .reel-meta .d { font-size: 11px; color: var(--accent); font-weight: 700; }
	.lb-meta .c, .reel-meta .c {
		font-size: 13px; color: var(--text);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;
	}
	.reel { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
</style>
