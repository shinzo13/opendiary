<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let confirmDelete = $state(false);

	function formatDate(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	}
</script>

<div class="page">
	<header>
		<a href="/" class="back-btn">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</a>
		<button class="delete-btn" onclick={() => (confirmDelete = true)}>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
				<path d="M10 11v6M14 11v6M9 6V4h6v2" />
			</svg>
		</button>
	</header>

	<div class="hero">
		<img src="/api/uploads/{data.entry.imageFilename}" alt={data.entry.description} />
	</div>

	<article>
		<time>{formatDate(data.entry.date)}</time>
		<h1>{data.entry.description}</h1>
		{#if data.entry.body}
			<p class="body">{data.entry.body}</p>
		{/if}
	</article>
</div>

{#if confirmDelete}
	<div class="overlay" role="dialog" aria-modal="true">
		<div class="dialog">
			<p>delete this entry?</p>
			<div class="dialog-actions">
				<button class="btn-cancel" onclick={() => (confirmDelete = false)}>cancel</button>
				<form method="POST" action="?/delete" use:enhance>
					<button type="submit" class="btn-delete">delete</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.page { display: flex; flex-direction: column; min-height: 100dvh; }

	header {
		position: absolute;
		top: 0; left: 0; right: 0;
		max-width: 640px;
		margin: 0 auto;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
	}

	.back-btn, .delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px; height: 40px;
		border-radius: 50%;
		background: rgba(0,0,0,0.5);
		backdrop-filter: blur(8px);
		border: none;
		color: #fff;
	}

	.hero { width: 100%; aspect-ratio: 1/1; overflow: hidden; background: var(--surface); }
	.hero img { width: 100%; height: 100%; object-fit: cover; }

	article {
		flex: 1;
		padding: 24px 20px 48px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	time { font-size: 12px; color: var(--accent); font-weight: 600; text-transform: lowercase; }
	h1 { font-size: 20px; font-weight: 700; line-height: 1.3; }
	.body { font-size: 15px; line-height: 1.7; color: #ccc; white-space: pre-wrap; }

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.7);
		display: flex;
		align-items: flex-end;
		z-index: 100;
		padding: 20px;
	}

	.dialog {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 24px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.dialog p { font-size: 16px; text-align: center; }

	.dialog-actions { display: flex; gap: 12px; }

	.dialog-actions form { flex: 1; display: flex; }

	.btn-cancel, .btn-delete {
		flex: 1;
		padding: 14px;
		border-radius: var(--radius);
		border: none;
		font-size: 15px;
		font-weight: 600;
		width: 100%;
	}

	.btn-cancel { background: var(--surface2); color: var(--text); }
	.btn-delete { background: #ff6b6b; color: #fff; }

	/* ── desktop ── */
	@media (min-width: 768px) {
		.page {
			max-width: 640px;
			margin: 0 auto;
		}

		.hero {
			aspect-ratio: auto;
			background: #000;
			border-radius: 0 0 var(--radius) var(--radius);
		}

		.hero img {
			width: 100%;
			height: auto;
			max-height: 70vh;
			object-fit: contain;
		}

		article { padding: 32px 24px 64px; }

		time { font-size: 14px; }
		h1 { font-size: 26px; }
		.body { font-size: 17px; }
	}
</style>
