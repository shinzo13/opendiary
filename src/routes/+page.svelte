<script lang="ts">
	// landing — public root, leads into register / sign in
</script>

<svelte:head>
	<title>opendiary — a photo journal</title>
</svelte:head>

<main class="landing">
	<div class="hero">
		<span class="eyebrow">open-source photo journal</span>

		<h1 class="wordmark">opendiary<span class="dot">.</span></h1>

		<p class="tagline">
			keep your days. <em>one photo, a few words,</em> and how it felt — threaded into a
			timeline of the life you actually lived.
		</p>

		<div class="actions">
			<a class="btn primary" href="/register">get started</a>
			<a class="btn ghost" href="/login">sign in</a>
		</div>

		<div class="chips">
			<span class="chip"><i></i>self-hosted</span>
			<span class="chip"><i></i>open source</span>
			<span class="chip"><i></i>yours, forever</span>
		</div>
	</div>

	<!-- decorative timeline motif (desktop only) -->
	<div class="motif" aria-hidden="true">
		<div class="spine"></div>
		<div class="node n1"></div>
		<div class="node n2"></div>
		<div class="node n3"></div>
		<div class="plus">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</div>
	</div>
</main>

<style>
	.landing {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		padding: 32px 24px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero {
		max-width: 620px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.eyebrow {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 18px;
	}

	.wordmark {
		font-size: clamp(46px, 12vw, 88px);
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 0.95;
	}
	.wordmark .dot { color: var(--accent); }

	.tagline {
		font-family: var(--serif);
		font-size: clamp(17px, 4.4vw, 23px);
		line-height: 1.5;
		color: var(--dim);
		margin: 22px auto 34px;
		max-width: 30ch;
	}
	.tagline em { color: var(--text); font-style: italic; }

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
	}

	.btn {
		padding: 15px 28px;
		border-radius: 14px;
		font-size: 15px;
		font-weight: 700;
		transition: 0.18s;
	}
	.btn.primary {
		background: var(--accent);
		color: #1a1304;
		box-shadow: 0 0 0 6px color-mix(in oklch, var(--accent) 14%, transparent);
	}
	.btn.primary:hover { filter: brightness(1.06); transform: translateY(-1px); }
	.btn.ghost {
		background: var(--card);
		border: 1px solid var(--line);
		color: var(--text);
	}
	.btn.ghost:hover { border-color: var(--accent); }

	.chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 18px;
		margin-top: 30px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--dim);
	}
	.chip i {
		width: 6px; height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}

	/* timeline motif hidden on small screens */
	.motif { display: none; }

	@media (min-width: 900px) {
		.landing {
			grid-template-columns: 1fr 280px;
			gap: 60px;
			padding: 32px 48px;
		}
		.hero { align-items: flex-start; text-align: left; }
		.tagline { margin: 22px 0 34px; }
		.actions, .chips { justify-content: flex-start; }

		.motif {
			display: block;
			position: relative;
			height: 340px;
		}
		.spine {
			position: absolute;
			left: 50%; top: 28px; bottom: 6px;
			width: 2px;
			transform: translateX(-50%);
			background: linear-gradient(var(--accent), color-mix(in oklch, var(--accent) 25%, transparent) 70%, transparent);
		}
		.plus {
			position: absolute;
			top: 0; left: 50%;
			transform: translateX(-50%);
			width: 50px; height: 50px;
			border-radius: 50%;
			background: var(--accent);
			color: #1a1304;
			display: grid;
			place-items: center;
			box-shadow: 0 0 0 6px color-mix(in oklch, var(--accent) 16%, transparent), 0 10px 30px rgba(0, 0, 0, 0.5);
		}
		.node {
			position: absolute;
			left: 50%;
			width: 11px; height: 11px;
			border-radius: 50%;
			background: var(--accent);
			transform: translateX(-50%);
			box-shadow: 0 0 12px color-mix(in oklch, var(--accent) 60%, transparent);
		}
		.node.n1 { top: 32%; }
		.node.n2 { top: 56%; }
		.node.n3 { top: 80%; }
	}
</style>
