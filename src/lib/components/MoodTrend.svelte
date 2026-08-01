<script lang="ts">
	import { onMount } from 'svelte';
	import {
		MOODS,
		MONTHS_SHORT,
		daysBetween,
		fmtShort,
		moodSeries,
		parseDate,
		type Entry,
		type MoodPoint
	} from '$lib/diary';

	let { entries }: { entries: Entry[] } = $props();

	const MIN_DAY_W = 26;
	// a longer silence than this breaks the line instead of faking a trend
	const GAP_DAYS = 14;
	const PAD = { top: 28, right: 24, bottom: 30, left: 24 };

	let scrollEl = $state<HTMLElement>();
	let wrapW = $state(0);

	const points = $derived(moodSeries(entries));
	const span = $derived(points.length ? points[points.length - 1].dayIndex : 0);
	const height = $derived(wrapW && wrapW < 560 ? 210 : 280);
	const plotH = $derived(height - PAD.top - PAD.bottom);
	const dayW = $derived(
		span > 0
			? Math.max(MIN_DAY_W, (Math.max(wrapW, 300) - PAD.left - PAD.right) / span)
			: MIN_DAY_W
	);
	const width = $derived(PAD.left + PAD.right + span * dayW);

	const px = (p: MoodPoint) => PAD.left + p.dayIndex * dayW;
	const py = (score: number) => PAD.top + (1 - score / 10) * plotH;

	const segments = $derived(
		points
			.slice(1)
			.map((b, i) => ({ a: points[i], b }))
			.filter((s) => s.b.dayIndex - s.a.dayIndex <= GAP_DAYS)
	);

	// smooth-ish cubic between two neighbours, control points pulled horizontally
	function curve(a: MoodPoint, b: MoodPoint): string {
		const x0 = px(a), y0 = py(a.score), x1 = px(b), y1 = py(b.score);
		const c = (x1 - x0) * 0.42;
		return `M ${x0} ${y0} C ${x0 + c} ${y0}, ${x1 - c} ${y1}, ${x1} ${y1}`;
	}

	function area(a: MoodPoint, b: MoodPoint): string {
		const base = PAD.top + plotH;
		return `${curve(a, b)} L ${px(b)} ${base} L ${px(a)} ${base} Z`;
	}

	const monthTicks = $derived.by(() => {
		if (points.length < 2) return [];
		const first = parseDate(points[0].date);
		const last = parseDate(points[points.length - 1].date);
		const out: { x: number; label: string }[] = [];
		let d = new Date(first.getFullYear(), first.getMonth(), 1, 12);
		while (d <= last) {
			if (d >= first) {
				const label =
					MONTHS_SHORT[d.getMonth()] +
					(d.getMonth() === 0 ? ` '${String(d.getFullYear()).slice(2)}` : '');
				out.push({ x: PAD.left + daysBetween(first, d) * dayW, label });
			}
			d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12);
		}
		return out;
	});

	let selectedId = $state<string | null>(null);
	const selected = $derived(
		points.find((p) => p.id === selectedId) ?? points[points.length - 1] ?? null
	);

	onMount(() => {
		requestAnimationFrame(() => {
			if (scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth;
		});
	});

	// vertical wheel scrolls the timeline sideways
	function onWheel(e: WheelEvent) {
		if (!scrollEl || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		const before = scrollEl.scrollLeft;
		scrollEl.scrollLeft += e.deltaY;
		if (scrollEl.scrollLeft !== before) e.preventDefault();
	}
</script>

{#if points.length === 0}
	<div class="empty">no moods logged yet — the line starts with your first entry</div>
{:else}
	<div class="chart">
		<div class="caps" style="height: {height}px; padding: {PAD.top}px 0 {PAD.bottom}px">
			<span>great</span>
			<span>rough</span>
		</div>

		<div class="scroll" bind:this={scrollEl} bind:clientWidth={wrapW} onwheel={onWheel}>
			<svg {width} {height} role="img" aria-label="mood over time">
				<defs>
					{#each segments as s, i (s.a.id + s.b.id)}
						<linearGradient
							id="line-{i}"
							gradientUnits="userSpaceOnUse"
							x1={px(s.a)} y1={py(s.a.score)} x2={px(s.b)} y2={py(s.b.score)}
						>
							<stop offset="0%" stop-color={s.a.color} />
							<stop offset="100%" stop-color={s.b.color} />
						</linearGradient>
						<linearGradient id="fill-{i}" gradientUnits="userSpaceOnUse"
							x1="0" y1={Math.min(py(s.a.score), py(s.b.score))} x2="0" y2={PAD.top + plotH}>
							<stop offset="0%" stop-color={s.a.color} stop-opacity="0.16" />
							<stop offset="100%" stop-color={s.b.color} stop-opacity="0" />
						</linearGradient>
					{/each}
				</defs>

				{#each [0, 5, 10] as level (level)}
					<line
						class="grid" x1="0" x2={width}
						y1={py(level)} y2={py(level)}
					/>
				{/each}

				{#each monthTicks as t (t.label + t.x)}
					<line class="tick" x1={t.x} x2={t.x} y1={PAD.top - 10} y2={PAD.top + plotH} />
					<text class="tick-label" x={t.x + 5} y={height - 10}>{t.label}</text>
				{/each}

				{#each segments as s, i (s.a.id + s.b.id)}
					<path d={area(s.a, s.b)} fill="url(#fill-{i})" />
				{/each}

				{#each segments as s, i (s.a.id + s.b.id)}
					<path
						class="line" d={curve(s.a, s.b)} fill="none"
						stroke="url(#line-{i})" stroke-width="3" stroke-linecap="round"
					/>
				{/each}

				{#each points as p (p.id)}
					<g
						class="dot" class:on={selected?.id === p.id}
						role="button" tabindex="0"
						aria-label="{fmtShort(p.date)}: {MOODS[p.mood].label}"
						onclick={() => (selectedId = p.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectedId = p.id;
							}
						}}
					>
						<circle class="hit" cx={px(p)} cy={py(p.score)} r="14" />
						{#if selected?.id === p.id}
							<circle class="halo" cx={px(p)} cy={py(p.score)} r="9" fill={p.color} />
						{/if}
						<circle cx={px(p)} cy={py(p.score)} r="4.5" fill={p.color} />
					</g>
				{/each}
			</svg>
		</div>
	</div>

	{#if selected}
		<a class="readout" href="/entry/{selected.id}">
			<span class="swatch" style="background: {selected.color}"></span>
			<span class="meta">
				<span class="when">{fmtShort(selected.date)}, {parseDate(selected.date).getFullYear()}</span>
				<span class="what">{MOODS[selected.mood].label} · {selected.description}</span>
			</span>
			{#if selected.sameDay > 1}
				<span class="more">+{selected.sameDay - 1}</span>
			{/if}
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</a>
	{/if}
{/if}

<style>
	.empty { font-size: 13px; color: var(--dim); }

	.chart { display: flex; gap: 4px; }

	.caps {
		flex: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		box-sizing: border-box;
	}
	.caps span {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dimmer);
	}

	.scroll {
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
		-ms-overflow-style: none;
		-webkit-overflow-scrolling: touch;
	}
	.scroll::-webkit-scrollbar { width: 0; height: 0; }

	.grid {
		stroke: color-mix(in oklch, var(--line) 55%, transparent);
		stroke-width: 1;
		stroke-dasharray: 2 6;
	}
	.tick { stroke: color-mix(in oklch, var(--line) 45%, transparent); stroke-width: 1; }
	.tick-label { fill: var(--dimmer); font-size: 10px; font-weight: 600; }

	.line { filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35)); }

	.dot { cursor: pointer; outline: none; }
	.dot .hit { fill: transparent; }
	.dot circle { transition: r 0.18s cubic-bezier(0.2, 0.7, 0.3, 1); }
	.halo { opacity: 0.3; }
	.dot:focus-visible .halo, .dot:focus-visible circle:last-child { stroke: var(--text); stroke-width: 1.5; }

	.readout {
		display: flex;
		align-items: center;
		gap: 11px;
		margin-top: 14px;
		padding: 12px 14px;
		border-radius: 14px;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
		transition: border-color 0.18s;
	}
	.readout:hover { border-color: var(--accent); }

	.swatch { width: 10px; height: 10px; border-radius: 50%; flex: none; }
	.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
	.when { font-size: 11.5px; font-weight: 700; color: var(--accent); }
	.what {
		font-size: 13px;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.more {
		flex: none;
		font-size: 11px;
		font-weight: 700;
		color: var(--dimmer);
	}

	@media (prefers-reduced-motion: reduce) {
		.dot circle { transition: none; }
	}
</style>
