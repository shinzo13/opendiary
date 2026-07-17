<script lang="ts">
	import { onMount } from 'svelte';
	import { loadPrefs, savePrefs } from '$lib/prefs';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showTracks = $state(false);
	let ready = $state(false);

	onMount(() => {
		showTracks = loadPrefs().showTracks;
		ready = true;
	});

	$effect(() => {
		if (ready) savePrefs({ showTracks });
	});
</script>

<div class="page">
	<header>
		<a href="/home" class="back" aria-label="back">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		<span class="title">settings</span>
		<span class="spacer"></span>
	</header>

	<main>
		<section>
			<div class="section-label">timeline</div>
			<label class="row">
				<div class="row-text">
					<span class="row-title">show tracks</span>
					<span class="row-sub">song of the day next to entries on the timeline</span>
				</div>
				<input type="checkbox" class="switch" bind:checked={showTracks} />
			</label>
		</section>

		<section>
			<div class="section-label">account</div>
			<div class="row">
				<div class="row-text">
					<span class="row-title">email</span>
					<span class="row-sub">{data.user.email}</span>
				</div>
			</div>
			<a href="/logout" class="row danger">
				<div class="row-text">
					<span class="row-title">sign out</span>
				</div>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
					<polyline points="16 17 21 12 16 7" />
					<line x1="21" y1="12" x2="9" y2="12" />
				</svg>
			</a>
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
		gap: 28px;
		padding: 12px 20px 48px;
		max-width: 560px;
		margin: 0 auto;
		width: 100%;
	}

	.section-label {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--dim);
		margin-bottom: 10px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		border-radius: 14px;
		background: var(--card);
		border: 1px solid var(--line);
		margin-bottom: 8px;
		cursor: pointer;
	}

	div.row { cursor: default; }

	.row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
	.row-title { font-size: 14.5px; font-weight: 600; }
	.row-sub { font-size: 12.5px; color: var(--dim); }

	.danger { color: #ff6b6b; }
	.danger .row-title { color: #ff6b6b; }

	.switch {
		appearance: none;
		width: 44px; height: 26px;
		border-radius: 999px;
		background: var(--surface2);
		position: relative;
		cursor: pointer;
		transition: background 0.2s;
		flex-shrink: 0;
	}
	.switch::after {
		content: '';
		position: absolute;
		top: 3px; left: 3px;
		width: 20px; height: 20px;
		border-radius: 50%;
		background: var(--bg);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
		transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.3, 1);
	}
	.switch:checked { background: var(--accent); }
	.switch:checked::after { transform: translateX(18px); }
</style>
