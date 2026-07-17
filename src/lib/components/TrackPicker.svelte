<script lang="ts">
	export type PickedTrack = { title: string; artist: string; cover: string };

	let { track = $bindable(null) }: { track: PickedTrack | null } = $props();

	let query = $state('');
	let results = $state<PickedTrack[]>([]);
	let searching = $state(false);
	let open = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function onInput() {
		clearTimeout(timer);
		const q = query.trim();
		if (q.length < 2) {
			results = [];
			open = false;
			return;
		}
		timer = setTimeout(async () => {
			searching = true;
			try {
				const res = await fetch(`/api/tracks?q=${encodeURIComponent(q)}`);
				if (res.ok) {
					results = (await res.json()).tracks;
					open = true;
				}
			} finally {
				searching = false;
			}
		}, 350);
	}

	function pick(t: PickedTrack) {
		track = t;
		query = '';
		results = [];
		open = false;
	}
</script>

<div class="track-label">song of the day</div>

{#if track}
	<div class="picked">
		<img src={track.cover} alt="" />
		<div class="meta">
			<span class="title">{track.title}</span>
			<span class="artist">{track.artist}</span>
		</div>
		<button type="button" class="remove" onclick={() => (track = null)} aria-label="remove track">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>
{:else}
	<div class="search">
		<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			type="text"
			placeholder="search a track..."
			bind:value={query}
			oninput={onInput}
			autocomplete="off"
		/>
		{#if searching}<span class="spin"></span>{/if}
	</div>
	{#if open && results.length > 0}
		<ul class="results">
			{#each results as t (t.title + t.artist)}
				<li>
					<button type="button" onclick={() => pick(t)}>
						<img src={t.cover} alt="" />
						<div class="meta">
							<span class="title">{t.title}</span>
							<span class="artist">{t.artist}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{:else if open && !searching}
		<div class="no-results">nothing found</div>
	{/if}
{/if}

<style>
	.track-label {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--dim);
		margin: 20px 0 10px;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 9px 14px;
		border-radius: 10px;
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--dim);
	}

	.search input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		color: var(--text);
		font-family: var(--font);
		font-size: 14px;
	}

	.search input::placeholder { color: var(--surface2); }

	.spin {
		width: 14px; height: 14px;
		border: 2px solid var(--line);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	.results {
		list-style: none;
		margin: 8px 0 0;
		padding: 4px;
		border-radius: 12px;
		background: var(--card);
		border: 1px solid var(--line);
		max-height: 280px;
		overflow-y: auto;
	}

	.results button {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 7px 8px;
		border-radius: 8px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition: background 0.15s;
	}
	.results button:hover { background: color-mix(in oklch, var(--accent) 10%, transparent); }

	.results img, .picked img {
		width: 42px; height: 42px;
		border-radius: 8px;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--surface);
	}

	.meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

	.title {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 12px;
		color: var(--dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-results {
		margin-top: 8px;
		font-size: 13px;
		color: var(--dim);
		padding: 4px 2px;
	}

	.picked {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 12px;
		background: var(--card);
		border: 1px solid color-mix(in oklch, var(--accent) 45%, var(--line));
	}

	.remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px; height: 30px;
		border-radius: 50%;
		background: none;
		border: none;
		color: var(--dim);
		cursor: pointer;
	}
	.remove:hover { color: var(--text); }
</style>
