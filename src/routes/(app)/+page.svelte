<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Toast from '$lib/components/Toast.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let menuOpen = $state(false);

	$effect(() => {
		if (data.welcome) replaceState('/', {});
	});

	function formatDate(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
	}
</script>

{#if data.welcome}
	<Toast message="account created" />
{/if}

<div class="page">
	<header>
		<span class="logo">OpenDiary</span>
		<div class="header-right">
			<a href="/new" class="add-btn" aria-label="new entry">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</a>
			<button class="avatar-btn" onclick={() => (menuOpen = true)} aria-label="profile">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
				</svg>
			</button>
		</div>
	</header>

	<main>
		{#if data.entries.length === 0}
			<div class="empty">
				<p>nothing here yet</p>
				<a href="/new" class="cta">add first entry</a>
			</div>
		{:else}
			<div class="timeline">
				<div class="spine"></div>
				{#each data.entries as entry, i (entry.id)}
					{@const side = i % 2 === 0 ? 'left' : 'right'}
					<div class="row {side}">
						{#if side === 'left'}
							<div class="spacer">
								<a href="/entry/{entry.id}" class="card">
									<div class="thumb">
										<img src="/api/uploads/{entry.imageFilename}" alt={entry.description} />
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
										<img src="/api/uploads/{entry.imageFilename}" alt={entry.description} />
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
	.page { display: flex; flex-direction: column; min-height: 100dvh; }

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

	.logo { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }

	.header-right { display: flex; align-items: center; gap: 8px; }

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px; height: 40px;
		border-radius: 50%;
		background: var(--accent);
		color: #111;
	}

	.avatar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px; height: 40px;
		border-radius: 50%;
		background: var(--surface);
		border: 1px solid var(--surface2);
		color: var(--text-muted);
	}

	main { flex: 1; padding: 24px 0 60px; }

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

	.timeline { position: relative; display: flex; flex-direction: column; }

	.spine {
		position: absolute;
		left: 50%; top: 0; bottom: 0;
		width: 2px;
		transform: translateX(-50%);
		background: var(--surface2);
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
		width: 12px; height: 12px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--bg);
		z-index: 2;
	}

	.spacer { flex: 1; display: flex; }
	.row.left .spacer  { justify-content: flex-end; }
	.row.right .spacer { justify-content: flex-start; }

	.card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 12px;
		max-width: calc(50vw - 20px);
	}

	.row.left .card  { flex-direction: row-reverse; }
	.row.right .card { flex-direction: row; }

	.thumb {
		flex-shrink: 0;
		width: 64px; height: 64px;
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface2);
	}

	.thumb img { width: 100%; height: 100%; object-fit: cover; }

	.info {
		flex: 1; min-width: 0;
		display: flex; flex-direction: column; gap: 4px;
	}

	.row.left .info  { text-align: right; }
	.row.right .info { text-align: left; }

	time { font-size: 11px; color: var(--accent); font-weight: 600; }

	p {
		font-size: 13px; line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* ── профиль ── */

	.overlay {
		position: fixed; inset: 0;
		background: rgba(0,0,0,0.5);
		z-index: 50;
	}

	.profile-sheet {
		position: fixed;
		bottom: 0; left: 0; right: 0;
		z-index: 51;
		background: var(--surface);
		border-radius: 20px 20px 0 0;
		padding: 24px 20px 40px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.profile-email {
		font-size: 13px;
		color: var(--text-muted);
		padding-bottom: 16px;
	}

	.divider {
		height: 1px;
		background: var(--surface2);
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

	/* ── desktop ── */
	@media (min-width: 768px) {
		header {
			max-width: 720px;
			margin: 0 auto;
			padding: 20px 24px;
		}

		.logo { font-size: 22px; }

		.add-btn, .avatar-btn { width: 44px; height: 44px; }

		main { padding: 40px 0 80px; }

		.timeline {
			max-width: 720px;
			margin: 0 auto;
		}

		.row { padding: 18px 0; }

		.card {
			gap: 16px;
			padding: 8px 20px;
			max-width: calc(360px - 20px);
		}

		.thumb { width: 96px; height: 96px; border-radius: 14px; }

		time { font-size: 13px; }
		p { font-size: 15px; }

		.profile-sheet {
			max-width: 400px;
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			border-radius: 20px;
			bottom: 24px;
		}
	}
</style>
