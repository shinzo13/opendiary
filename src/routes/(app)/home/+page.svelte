<script lang="ts">
	import { replaceState } from '$app/navigation';
	import Toast from '$lib/components/Toast.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import MiniCalendar from '$lib/components/MiniCalendar.svelte';
	import MoodChart from '$lib/components/MoodChart.svelte';
	import LookingBack from '$lib/components/LookingBack.svelte';
	import { MOODS, fmtShort, type Entry } from '$lib/diary';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const entries = $derived(data.entries as Entry[]);

	let menuOpen = $state(false);
	let panelsOpen = $state(false);

	$effect(() => {
		if (data.welcome) replaceState('/home', {});
	});
</script>

{#if data.welcome}
	<Toast message="account created" />
{/if}

<div class="page">
	<header>
		<span class="logo">opendiary<span class="dot">.</span></span>
		<div class="header-right">
			<button class="avatar-btn" onclick={() => (menuOpen = true)} aria-label="profile">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
				</svg>
			</button>
		</div>
	</header>

	<main>
		{#if entries.length === 0}
			<div class="empty">
				<p>nothing here yet</p>
				<a href="/new" class="cta">add first entry</a>
			</div>
		{:else}
			<button class="panels-toggle" onclick={() => (panelsOpen = true)} aria-label="open insights">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>

			<div class="stage">
				<aside class="side">
					<div class="cell"><StatsPanel {entries} /></div>
					<div class="cell"><MiniCalendar {entries} /></div>
					<div class="cell wide"><MoodChart {entries} /></div>
					<div class="cell wide"><LookingBack {entries} /></div>
				</aside>

				<div class="timeline-wrap">
					<div class="timeline">
						<div class="spine"></div>
						<a href="/new" class="add-node" aria-label="new entry">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
						</a>
						{#each entries as entry, i (entry.id)}
							{@const side = i % 2 === 0 ? 'left' : 'right'}
							<div class="row {side}">
								{#if side === 'left'}
									<div class="spacer">
										<a href="/entry/{entry.id}" class="card">
											<div class="thumb">
												<img src="/api/uploads/{entry.imageFilename}" alt={entry.description} />
											</div>
											<div class="info">
												<time>{fmtShort(entry.date)}</time>
												<p>{entry.description}</p>
												{#if entry.mood && MOODS[entry.mood]}
													<span class="mood"><i style="background: {MOODS[entry.mood].color}"></i>{MOODS[entry.mood].label}</span>
												{/if}
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
												<img src="/api/uploads/{entry.imageFilename}" alt={entry.description} />
											</div>
											<div class="info">
												<time>{fmtShort(entry.date)}</time>
												<p>{entry.description}</p>
												{#if entry.mood && MOODS[entry.mood]}
													<span class="mood"><i style="background: {MOODS[entry.mood].color}"></i>{MOODS[entry.mood].label}</span>
												{/if}
											</div>
										</a>
									</div>
								{/if}
							</div>
						{/each}
						<span class="origin">where it began</span>
					</div>
				</div>
			</div>

			{#if panelsOpen}
				<div class="drawer-overlay" role="presentation" onclick={() => (panelsOpen = false)}></div>
				<aside class="drawer">
					<div class="drawer-head">
						<span>insights</span>
						<button class="drawer-close" onclick={() => (panelsOpen = false)} aria-label="close">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
					<div class="drawer-body">
						<StatsPanel {entries} />
						<MiniCalendar {entries} />
						<MoodChart {entries} />
						<LookingBack {entries} />
					</div>
				</aside>
			{/if}
		{/if}
	</main>
</div>

<!-- меню профиля -->
{#if menuOpen}
	<div class="overlay" role="presentation" onclick={() => (menuOpen = false)}></div>
	<div class="profile-sheet">
		<div class="profile-email">{data.user.email}</div>
		<div class="divider"></div>
		<a href="/logout" class="menu-item danger">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
				<polyline points="16 17 21 12 16 7" />
				<line x1="21" y1="12" x2="9" y2="12" />
			</svg>
			sign out
		</a>
	</div>
{/if}

<style>
	.page { position: relative; display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

	header {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		backdrop-filter: blur(14px) saturate(1.1);
		background: color-mix(in oklch, var(--bg) 72%, transparent);
		border-bottom: 1px solid color-mix(in oklch, var(--line) 50%, transparent);
	}

	.logo { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
	.logo .dot { color: var(--accent); }

	.header-right { display: flex; align-items: center; gap: 8px; }

	.avatar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px; height: 42px;
		border-radius: 50%;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
		transition: 0.2s;
	}
	.avatar-btn:hover { border-color: var(--accent); color: var(--text); }

	main { flex: 1; min-height: 0; }

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 80px;
		color: var(--dim);
		font-size: 16px;
	}

	.cta {
		padding: 12px 24px;
		background: var(--accent);
		color: #1a1304;
		border-radius: var(--radius);
		font-weight: 700;
	}

	/* ── stage (mobile: single column, panels hidden) ── */
	.stage { display: block; height: 100%; }
	.side { display: none; }

	/* timeline is its own scroll container (no visible scrollbar) */
	.timeline-wrap {
		height: 100%;
		overflow-y: auto;
		padding: 16px 0 60px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.timeline-wrap::-webkit-scrollbar { width: 0; height: 0; }

	/* ── timeline ── */

	.timeline { position: relative; display: flex; flex-direction: column; }

	.spine {
		position: absolute;
		left: 50%; top: 56px; bottom: 30px;
		width: 2px;
		transform: translateX(-50%);
		background: linear-gradient(var(--accent), color-mix(in oklch, var(--accent) 25%, transparent) 70%, transparent);
	}

	.add-node {
		align-self: center;
		position: relative;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 54px; height: 54px;
		border-radius: 50%;
		background: var(--accent);
		color: #1a1304;
		margin-bottom: 18px;
		box-shadow: 0 0 0 6px color-mix(in oklch, var(--accent) 16%, transparent), 0 10px 30px rgba(0, 0, 0, 0.5);
		transition: 0.2s;
	}
	.add-node:hover { transform: scale(1.08) rotate(90deg); }

	.origin {
		align-self: center;
		position: relative;
		z-index: 3;
		margin-top: 16px;
		padding: 6px 12px;
		color: var(--dimmer);
		font-size: 12.5px;
		font-style: italic;
	}

	.row {
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;
		padding: 12px 0;
	}

	.node {
		flex-shrink: 0;
		width: 11px; height: 11px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 12px color-mix(in oklch, var(--accent) 60%, transparent);
		z-index: 2;
	}

	.spacer { flex: 1; display: flex; }
	.row.left .spacer  { justify-content: flex-end; }
	.row.right .spacer { justify-content: flex-start; }

	.card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		max-width: calc(50vw - 20px);
		border-radius: 20px;
		transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.3, 1), background 0.22s;
	}
	.card:hover { transform: translateY(-4px); background: color-mix(in oklch, var(--panel) 50%, transparent); }

	.row.left .card  { flex-direction: row-reverse; }
	.row.right .card { flex-direction: row; }

	.thumb {
		flex-shrink: 0;
		width: 64px; height: 64px;
		border-radius: 14px;
		overflow: hidden;
		background: var(--card);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		transition: filter 0.22s, box-shadow 0.22s;
	}
	.card:hover .thumb {
		filter: brightness(1.08);
		box-shadow: 0 12px 34px rgba(0, 0, 0, 0.55), 0 0 0 1px color-mix(in oklch, var(--accent) 40%, transparent);
	}

	.thumb img { width: 100%; height: 100%; object-fit: cover; }

	.info {
		flex: 1; min-width: 0;
		display: flex; flex-direction: column; gap: 4px;
	}

	.row.left .info  { text-align: right; align-items: flex-end; }
	.row.right .info { text-align: left; align-items: flex-start; }

	time { font-size: 12px; color: var(--accent); font-weight: 700; }

	p {
		font-size: 14px; font-weight: 600; line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}

	.mood {
		display: inline-flex; align-items: center; gap: 5px;
		font-size: 11.5px; color: var(--dim); margin-top: 1px;
	}
	.mood i { width: 7px; height: 7px; border-radius: 50%; }

	/* ── профиль ── */

	.overlay {
		position: fixed; inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
	}

	.profile-sheet {
		position: fixed;
		bottom: 0; left: 0; right: 0;
		z-index: 51;
		background: var(--panel);
		border: 1px solid var(--panel-line);
		border-radius: 20px 20px 0 0;
		padding: 24px 20px 40px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.profile-email {
		font-size: 13px;
		color: var(--dim);
		padding-bottom: 16px;
	}

	.divider {
		height: 1px;
		background: var(--line);
		margin-bottom: 8px;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 4px;
		font-size: 15px;
		border-radius: 8px;
	}

	.menu-item.danger { color: #ff6b6b; }

	/* ── mobile insights drawer ── */
	.panels-toggle {
		position: absolute;
		top: 76px;
		left: 12px;
		z-index: 25;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px; height: 34px;
		border-radius: 50%;
		background: color-mix(in oklch, var(--panel) 88%, transparent);
		border: 1px solid var(--panel-line);
		backdrop-filter: blur(10px);
		color: var(--accent);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
	}

	.drawer-overlay {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: rgba(0, 0, 0, 0.5);
		animation: fade 0.2s ease;
	}

	.drawer {
		position: fixed;
		top: 0; left: 0; bottom: 0;
		z-index: 56;
		width: min(86vw, 360px);
		background: var(--bg);
		border-right: 1px solid var(--panel-line);
		overflow-y: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		animation: slide-in 0.26s cubic-bezier(0.2, 0.7, 0.3, 1);
	}
	.drawer::-webkit-scrollbar { width: 0; height: 0; }

	.drawer-head {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 16px 12px;
		background: var(--bg);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.drawer-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px; height: 34px;
		border-radius: 50%;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
	}

	.drawer-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 4px 16px 32px;
	}

	@keyframes fade { from { opacity: 0; } }
	@keyframes slide-in { from { transform: translateX(-100%); } }

	/* ── tablet: roomier timeline ── */
	@media (min-width: 768px) {
		header { padding: 20px 32px; }
		.logo { font-size: 23px; }
		.timeline-wrap { padding: 30px 0 80px; }
		.timeline { max-width: 720px; margin: 0 auto; }
		.row { padding: 18px 0; }
		.card { gap: 16px; padding: 12px; max-width: 380px; }
		.thumb { width: 110px; height: 110px; border-radius: 16px; }
		time { font-size: 14px; }
		p { font-size: 16px; }

		.profile-sheet {
			max-width: 400px;
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			border-radius: 20px;
			bottom: 24px;
		}
	}

	/* ── desktop: side panels (2-up + 1 wide), fixed while timeline scrolls ── */
	@media (min-width: 1180px) {
		.stage {
			display: grid;
			grid-template-columns: 480px minmax(0, 1fr);
			gap: 28px;
			max-width: 1320px;
			margin: 0 auto;
			padding: 0 30px;
		}
		.side {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 18px;
			align-content: start;
			max-height: 100%;
			overflow-y: auto;
			padding: 30px 0;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		.side::-webkit-scrollbar { width: 0; height: 0; }
		.cell { display: flex; }
		.cell :global(.panel) { flex: 1; width: 100%; }
		.cell.wide { grid-column: 1 / -1; }
		.timeline-wrap { min-width: 0; padding: 30px 30px 80px; }
		.timeline { margin: 0 auto; }

		.panels-toggle, .drawer, .drawer-overlay { display: none; }
	}
</style>
