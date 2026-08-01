<script lang="ts">
	import { onMount } from 'svelte';
	import {
		MOODS,
		MONTHS,
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
	const PAD = { top: 28, right: 24, bottom: 34, left: 24 };
	const RANGES = [
		{ label: '30d', days: 30 },
		{ label: '90d', days: 90 },
		{ label: 'all', days: 0 }
	];

	let scrollEl = $state<HTMLElement>();
	let wrapW = $state(0);

	const today = new Date();
	const allPoints = $derived(moodSeries(entries));

	// open on the shortest range that still has something to show
	let range = $state<number | null>(null);
	const activeRange = $derived(
		range ??
			(RANGES.find((r) => r.days && allPoints.filter((p) => back(p) < r.days).length >= 5)?.days ?? 0)
	);

	function back(p: MoodPoint): number {
		return daysBetween(parseDate(p.date), today);
	}

	const visible = $derived(
		activeRange === 0
			? entries
			: entries.filter((e) => daysBetween(parseDate(e.date), today) < activeRange)
	);
	const points = $derived(moodSeries(visible));
	const first = $derived(points.length ? parseDate(points[0].date) : today);
	const todayIndex = $derived(points.length ? daysBetween(first, today) : 0);
	const span = $derived(
		points.length ? Math.max(points[points.length - 1].dayIndex, todayIndex) : 0
	);

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
	const dayAt = (i: number) =>
		new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, 12);

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

	// day numbers along the axis, thinned to whatever fits; the 1st of a month
	// always gets its name and wins over a neighbouring plain number
	const dayLabels = $derived.by(() => {
		if (points.length < 2) return [];
		const step = Math.max(1, Math.ceil(56 / dayW));
		const out: { x: number; label: string; strong: boolean }[] = [];
		for (let i = 0; i <= span; i++) {
			const d = dayAt(i);
			const monthStart = d.getDate() === 1;
			if (!monthStart && i % step !== 0) continue;
			out.push({
				x: PAD.left + i * dayW,
				label: monthStart
					? MONTHS_SHORT[d.getMonth()] + (d.getMonth() === 0 ? ` '${String(d.getFullYear()).slice(2)}` : '')
					: String(d.getDate()),
				strong: monthStart
			});
		}
		return out.filter(
			(l, i) => l.strong || !out.some((o, j) => o.strong && j !== i && Math.abs(o.x - l.x) < 34)
		);
	});

	const monthTicks = $derived(dayLabels.filter((l) => l.strong));
	const todayX = $derived(points.length ? PAD.left + todayIndex * dayW : 0);

	let monthLabel = $state('');
	function trackMonth() {
		if (!scrollEl || !points.length) return;
		const i = Math.max(0, Math.round((scrollEl.scrollLeft + 10 - PAD.left) / dayW));
		const d = dayAt(Math.min(i, span));
		monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
	}

	let selectedId = $state<string | null>(null);
	const selected = $derived(
		points.find((p) => p.id === selectedId) ?? points[points.length - 1] ?? null
	);

	const stats = $derived.by(() => {
		if (points.length === 0) return null;
		const avg = points.reduce((s, p) => s + p.score, 0) / points.length;
		let best = points[0];
		let worst = points[0];
		for (const p of points) {
			if (p.score >= best.score) best = p;
			if (p.score <= worst.score) worst = p;
		}
		// same-length window just before this one, for the trend arrow
		const win = activeRange || span + 1;
		const prev = allPoints.filter((p) => back(p) >= win && back(p) < win * 2);
		const prevAvg = prev.length ? prev.reduce((s, p) => s + p.score, 0) / prev.length : null;
		return { avg, best, worst, delta: prevAvg === null ? null : avg - prevAvg };
	});

	function toEnd() {
		requestAnimationFrame(() => {
			if (scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth;
			trackMonth();
		});
	}

	function jumpTo(p: MoodPoint) {
		selectedId = p.id;
		if (!scrollEl) return;
		scrollEl.scrollTo({ left: px(p) - scrollEl.clientWidth / 2, behavior: 'smooth' });
	}

	onMount(toEnd);

	// a new range redraws the axis from scratch — land on the recent days again
	$effect(() => {
		activeRange;
		toEnd();
	});

	// vertical wheel scrolls the timeline sideways
	function onWheel(e: WheelEvent) {
		if (!scrollEl || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		const before = scrollEl.scrollLeft;
		scrollEl.scrollLeft += e.deltaY;
		if (scrollEl.scrollLeft !== before) e.preventDefault();
	}
</script>

{#if allPoints.length === 0}
	<div class="empty">no moods logged yet — the line starts with your first entry</div>
{:else}
	<div class="ranges">
		{#each RANGES as r (r.label)}
			<button class:on={activeRange === r.days} onclick={() => (range = r.days)}>{r.label}</button>
		{/each}
	</div>

	{#if stats}
		<div class="tiles">
			<div class="tile">
				<span class="k">average</span>
				<span class="v">
					{stats.avg.toFixed(1)}<span class="unit">/10</span>
					{#if stats.delta !== null && Math.abs(stats.delta) >= 0.05}
						<span class="delta" class:up={stats.delta > 0}>
							{stats.delta > 0 ? '↑' : '↓'}{Math.abs(stats.delta).toFixed(1)}
						</span>
					{/if}
				</span>
			</div>
			<button class="tile" onclick={() => jumpTo(stats.best)}>
				<span class="k">brightest</span>
				<span class="v sm"><i style="background: {stats.best.color}"></i>{fmtShort(stats.best.date)}</span>
			</button>
			<button class="tile" onclick={() => jumpTo(stats.worst)}>
				<span class="k">hardest</span>
				<span class="v sm"><i style="background: {stats.worst.color}"></i>{fmtShort(stats.worst.date)}</span>
			</button>
		</div>
	{/if}

	<div class="chart" class:hidden={points.length === 0}>
		<div class="caps" style="height: {height}px; padding: {PAD.top}px 0 {PAD.bottom}px">
			<span>great</span>
			<span>rough</span>
		</div>

		<div class="plot">
			{#if monthLabel}
				<span class="month-pill">{monthLabel}</span>
			{/if}

			<div
				class="scroll"
				bind:this={scrollEl}
				bind:clientWidth={wrapW}
				onscroll={trackMonth}
				onwheel={onWheel}
			>
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
						<line class="grid" x1="0" x2={width} y1={py(level)} y2={py(level)} />
					{/each}

					{#each monthTicks as t (t.x)}
						<line class="tick" x1={t.x} x2={t.x} y1={PAD.top - 10} y2={PAD.top + plotH} />
					{/each}

					{#if points.length > 1}
						<line class="today" x1={todayX} x2={todayX} y1={PAD.top - 14} y2={PAD.top + plotH} />
						<text class="today-label" x={todayX} y={PAD.top - 18} text-anchor="middle">today</text>
					{/if}

					{#each dayLabels as l (l.x)}
						<text
							class="day-label" class:strong={l.strong}
							x={l.x} y={height - 12} text-anchor="middle"
						>{l.label}</text>
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
	{:else}
		<div class="empty gap">nothing logged in this stretch — try a wider range</div>
	{/if}
{/if}

<style>
	.empty { font-size: 13px; color: var(--dim); }
	.empty.gap { margin-top: 14px; }

	.ranges { display: flex; gap: 6px; margin-bottom: 12px; }
	.ranges button {
		padding: 5px 12px;
		border-radius: 999px;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
		font-size: 11.5px;
		font-weight: 700;
		cursor: pointer;
		transition: 0.16s;
	}
	.ranges button:hover { color: var(--text); }
	.ranges button.on {
		background: color-mix(in oklch, var(--accent) 18%, transparent);
		border-color: color-mix(in oklch, var(--accent) 55%, transparent);
		color: var(--accent);
	}

	.tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
	.tile {
		display: flex;
		flex-direction: column;
		gap: 5px;
		align-items: flex-start;
		padding: 10px 12px;
		border-radius: 14px;
		background: var(--card);
		border: 1px solid var(--line);
		text-align: left;
		transition: border-color 0.16s;
	}
	button.tile { cursor: pointer; }
	button.tile:hover { border-color: var(--accent); }
	.tile .k {
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dimmer);
	}
	.tile .v {
		display: inline-flex;
		align-items: baseline;
		gap: 5px;
		font-size: 19px;
		font-weight: 800;
		color: var(--text);
		line-height: 1;
	}
	.tile .v.sm { align-items: center; font-size: 13.5px; font-weight: 700; }
	.tile .v i { width: 8px; height: 8px; border-radius: 50%; flex: none; }
	.unit { font-size: 11px; font-weight: 700; color: var(--dimmer); }
	.delta { font-size: 11.5px; font-weight: 700; color: #cf5043; }
	.delta.up { color: #6fbf73; }

	.chart { display: flex; gap: 4px; }
	.chart.hidden { display: none; }
	.plot { position: relative; min-width: 0; flex: 1; }

	.month-pill {
		position: absolute;
		top: 4px; left: 4px;
		z-index: 2;
		padding: 3px 9px;
		border-radius: 999px;
		background: color-mix(in oklch, var(--bg) 78%, transparent);
		backdrop-filter: blur(6px);
		border: 1px solid color-mix(in oklch, var(--panel-line) 60%, transparent);
		font-size: 10.5px;
		font-weight: 700;
		color: var(--dim);
		pointer-events: none;
	}

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
	.today {
		stroke: color-mix(in oklch, var(--accent) 45%, transparent);
		stroke-width: 1;
		stroke-dasharray: 3 4;
	}
	.today-label {
		fill: color-mix(in oklch, var(--accent) 80%, transparent);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
	}

	.day-label { fill: var(--dimmer); font-size: 10px; font-weight: 600; }
	.day-label.strong { fill: var(--dim); font-weight: 800; }

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
	.more { flex: none; font-size: 11px; font-weight: 700; color: var(--dimmer); }

	@media (prefers-reduced-motion: reduce) {
		.dot circle { transition: none; }
	}
</style>
