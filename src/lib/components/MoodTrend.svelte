<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import {
		MOODS,
		MONTHS,
		MONTHS_SHORT,
		daysBetween,
		fmtShort,
		mixHex,
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
	// half a viewport of slack on both sides, so the cursor can reach the ends
	const slack = $derived(Math.round(Math.max(wrapW, 300) / 2));

	const px = (p: MoodPoint) => PAD.left + p.dayIndex * dayW;
	const py = (score: number) => PAD.top + (1 - score / 10) * plotH;
	const scoreAtY = (y: number) => (1 - (y - PAD.top) / plotH) * 10;
	const dayAt = (i: number) =>
		new Date(first.getFullYear(), first.getMonth(), first.getDate() + i, 12);

	const segments = $derived(
		points
			.slice(1)
			.map((b, i) => ({ a: points[i], b }))
			.filter((s) => s.b.dayIndex - s.a.dayIndex <= GAP_DAYS)
	);

	// smooth-ish cubic between two neighbours, control points pulled horizontally
	const BEND = 0.42;

	function curve(a: MoodPoint, b: MoodPoint): string {
		const x0 = px(a), y0 = py(a.score), x1 = px(b), y1 = py(b.score);
		const c = (x1 - x0) * BEND;
		return `M ${x0} ${y0} C ${x0 + c} ${y0}, ${x1 - c} ${y1}, ${x1} ${y1}`;
	}

	function area(a: MoodPoint, b: MoodPoint): string {
		const base = PAD.top + plotH;
		return `${curve(a, b)} L ${px(b)} ${base} L ${px(a)} ${base} Z`;
	}

	// where the curve sits at a given x — bisect the cubic on x, then read y
	function curveYAt(a: MoodPoint, b: MoodPoint, x: number): number {
		const x0 = px(a), x1 = px(b);
		const cx1 = x0 + (x1 - x0) * BEND;
		const cx2 = x1 - (x1 - x0) * BEND;
		const at = (p0: number, p1: number, p2: number, p3: number, t: number) => {
			const u = 1 - t;
			return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
		};
		let lo = 0, hi = 1;
		for (let i = 0; i < 18; i++) {
			const mid = (lo + hi) / 2;
			if (at(x0, cx1, cx2, x1, mid) < x) lo = mid;
			else hi = mid;
		}
		const t = (lo + hi) / 2;
		return at(py(a.score), py(a.score), py(b.score), py(b.score), t);
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

	// ── the moving cursor: follows the scroll, or the mouse while it hovers ──
	let scrollX = $state(0);
	let hoverX = $state<number | null>(null);
	let frame = 0;

	const cursorX = $derived(
		Math.min(width - PAD.right, Math.max(PAD.left, hoverX ?? scrollX + Math.max(wrapW, 300) / 2 - slack))
	);

	function readScroll() {
		if (frame || !scrollEl) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (scrollEl) scrollX = scrollEl.scrollLeft;
		});
	}

	function onScroll() {
		hoverX = null;
		readScroll();
	}

	// vertical wheel scrolls the timeline sideways
	function onWheel(e: WheelEvent) {
		if (!scrollEl || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		const before = scrollEl.scrollLeft;
		scrollEl.scrollLeft += e.deltaY;
		if (scrollEl.scrollLeft !== before) e.preventDefault();
	}

	// arrows step the cursor from one logged day to the next
	function onKeys(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		if (!nearest) return;
		e.preventDefault();
		const i = points.indexOf(nearest);
		const next = points[Math.min(points.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))];
		scrollToX(px(next));
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || !scrollEl) return;
		const box = scrollEl.getBoundingClientRect();
		hoverX = e.clientX - box.left + scrollEl.scrollLeft - slack;
	}

	// the segment the cursor sits on, if any
	const onSegment = $derived(
		segments.find((s) => cursorX >= px(s.a) && cursorX <= px(s.b)) ?? null
	);

	const nearest = $derived.by(() => {
		if (points.length === 0) return null;
		let best = points[0];
		for (const p of points) {
			if (Math.abs(px(p) - cursorX) < Math.abs(px(best) - cursorX)) best = p;
		}
		return best;
	});

	// colour and height under the cursor, blended across the segment it rides
	const cursor = $derived.by(() => {
		if (!nearest) return null;
		if (!onSegment) {
			return { y: py(nearest.score), color: nearest.color, score: nearest.score, live: false };
		}
		const { a, b } = onSegment;
		const t = (cursorX - px(a)) / Math.max(1, px(b) - px(a));
		const y = curveYAt(a, b, cursorX);
		return { y, color: mixHex(a.color, b.color, t), score: scoreAtY(y), live: true };
	});

	let monthLabel = $state('');
	$effect(() => {
		if (!points.length) return;
		const i = Math.max(0, Math.min(span, Math.round((cursorX - PAD.left) / dayW)));
		const d = dayAt(i);
		monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
	});

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
			if (!scrollEl) return;
			scrollEl.scrollLeft = scrollEl.scrollWidth;
			scrollX = scrollEl.scrollLeft;
		});
	}

	function scrollToX(x: number, smooth = true) {
		if (!scrollEl) return;
		hoverX = null;
		scrollEl.scrollTo({
			left: x + slack - Math.max(wrapW, 300) / 2,
			behavior: smooth ? 'smooth' : 'auto'
		});
	}

	onMount(toEnd);

	// a new range redraws the axis from scratch — land on the recent days again
	$effect(() => {
		activeRange;
		toEnd();
	});
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
			<button class="tile" onclick={() => scrollToX(px(stats.best))}>
				<span class="k">brightest</span>
				<span class="v sm"><i style="background: {stats.best.color}"></i>{fmtShort(stats.best.date)}</span>
			</button>
			<button class="tile" onclick={() => scrollToX(px(stats.worst))}>
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
				role="slider"
				tabindex="0"
				aria-label="scrub through the mood timeline"
				aria-valuemin={0}
				aria-valuemax={span}
				aria-valuenow={Math.round((cursorX - PAD.left) / dayW)}
				aria-valuetext={nearest ? `${fmtShort(nearest.date)}, ${MOODS[nearest.mood].label}` : ''}
				onkeydown={onKeys}
				bind:this={scrollEl}
				bind:clientWidth={wrapW}
				onscroll={onScroll}
				onwheel={onWheel}
				onpointermove={onPointerMove}
				onpointerleave={() => (hoverX = null)}
			>
				<div class="track" style="padding: 0 {slack}px">
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

						<g class="ink">
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
								<circle
									class="dot" class:near={nearest?.id === p.id}
									cx={px(p)} cy={py(p.score)} r="4.5" fill={p.color}
								/>
							{/each}
						</g>

						{#if cursor}
							<line
								class="cursor-line"
								x1={cursorX} x2={cursorX} y1={PAD.top - 14} y2={PAD.top + plotH}
								stroke={cursor.color}
							/>
							<circle class="cursor-halo" cx={cursorX} cy={cursor.y} r="11" fill={cursor.color} />
							<circle class="cursor-dot" cx={cursorX} cy={cursor.y} r="5.5" fill={cursor.color} />
						{/if}
					</svg>
				</div>
			</div>
		</div>
	</div>

	{#if nearest && cursor}
		<a
			class="readout" href="/entry/{nearest.id}"
			style="--mood: {cursor.color}"
		>
			<span class="level">
				<span class="num">{cursor.score.toFixed(1)}</span>
				<span class="unit">/10</span>
			</span>
			<span class="meta">
				{#key nearest.id}
					<span class="lines" in:fade={{ duration: 160 }}>
						<span class="when">{fmtShort(nearest.date)}, {parseDate(nearest.date).getFullYear()}</span>
						<span class="what">{MOODS[nearest.mood].label} · {nearest.description}</span>
					</span>
				{/key}
			</span>
			{#if nearest.sameDay > 1}
				<span class="more">+{nearest.sameDay - 1}</span>
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
		cursor: crosshair;
	}
	.scroll::-webkit-scrollbar { width: 0; height: 0; }
	.track { display: inline-block; }

	.ink { animation: ink-in 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) both; transform-origin: bottom; }
	@keyframes ink-in {
		from { opacity: 0; transform: translateY(10px) scaleY(0.94); }
	}

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

	.dot { transition: r 0.2s cubic-bezier(0.2, 0.7, 0.3, 1); }
	.dot.near { r: 3; opacity: 0.75; }

	.cursor-line { stroke-width: 1; opacity: 0.45; stroke-dasharray: 3 4; }
	.cursor-halo { opacity: 0.22; }
	.cursor-dot { stroke: var(--bg); stroke-width: 2; }

	.readout {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 14px;
		padding: 12px 14px;
		border-radius: 14px;
		background: linear-gradient(
			100deg,
			color-mix(in oklch, var(--mood) 14%, transparent),
			transparent 62%
		), var(--card);
		border: 1px solid color-mix(in oklch, var(--mood) 45%, var(--line));
		color: var(--dim);
		transition: border-color 0.35s linear, background 0.35s linear;
	}

	.level { display: flex; align-items: baseline; gap: 2px; flex: none; }
	.level .num {
		font-size: 22px;
		font-weight: 800;
		color: var(--mood);
		line-height: 1;
		transition: color 0.35s linear;
		font-variant-numeric: tabular-nums;
	}

	.meta { flex: 1; min-width: 0; display: grid; }
	/* the outgoing line fades on top of the incoming one */
	.lines { grid-area: 1 / 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
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
		.dot { transition: none; }
		.ink { animation: none; }
	}
</style>
