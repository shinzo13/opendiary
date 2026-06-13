<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// Chrome на Android игнорирует -webkit-touch-callout: long-press по картинке
	// открывает нативное меню через событие contextmenu. глушим его везде, кроме
	// полей ввода (там нужно меню вставки).
	onMount(() => {
		const onContextMenu = (e: Event) => {
			const t = e.target as HTMLElement | null;
			if (t?.closest('input, textarea, [contenteditable="true"]')) return;
			e.preventDefault();
		};
		document.addEventListener('contextmenu', onContextMenu);
		return () => document.removeEventListener('contextmenu', onContextMenu);
	});
</script>

<svelte:head>
	<title>opendiary</title>
</svelte:head>

<!-- subtle film grain over a flat warm-black bg -->
<div class="atmo" aria-hidden="true">
	<div class="grain"></div>
</div>

<div class="app">
	{@render children()}
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		/* убрать нативную «вебовость» — чтобы PWA ощущалась как приложение */
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		user-select: none;
		-webkit-user-select: none;
	}

	/* поля ввода и явно выделяемое — оставить selectable */
	:global(input, textarea, [contenteditable='true'], .selectable) {
		user-select: text;
		-webkit-user-select: text;
		-webkit-touch-callout: default;
	}

	/* картинки нельзя таскать/вызывать по ним меню */
	:global(img) {
		-webkit-user-drag: none;
	}

	/* убрать pull-to-refresh и резиновый overscroll */
	:global(html, body) {
		overscroll-behavior: none;
		-webkit-overflow-scrolling: touch;
	}

	:global(:root) {
		/* warm-tinted dark palette */
		--bg: oklch(0.17 0.012 70);
		--bg-deep: oklch(0.13 0.01 70);
		--panel: oklch(0.205 0.012 72);
		--panel-line: oklch(0.3 0.012 72);
		--card: oklch(0.225 0.013 72);
		--line: oklch(0.34 0.012 72);
		--text: oklch(0.96 0.006 80);
		--dim: oklch(0.66 0.012 78);
		--dimmer: oklch(0.5 0.01 78);
		--accent: #f5c242;
		--accent-soft: color-mix(in oklch, var(--accent) 16%, transparent);

		--sans: 'Hanken Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
		--serif: 'Newsreader', Georgia, serif;

		--radius: 12px;

		/* legacy aliases (kept so existing components keep working) */
		--surface: var(--panel);
		--surface2: var(--line);
		--text-muted: var(--dim);
		--font: var(--sans);
	}

	:global(body) {
		background: var(--bg);
		color: var(--text);
		font-family: var(--sans);
		min-height: 100dvh;
		overflow-x: hidden;
		-webkit-font-smoothing: antialiased;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(button) {
		cursor: pointer;
		font-family: inherit;
	}

	.app { position: relative; z-index: 1; }

	/* ── grain overlay (flat warm-black bg, no glows/gradients) ── */
	.atmo { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
	.grain {
		position: absolute; inset: -50%; opacity: 0.05; mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
</style>
