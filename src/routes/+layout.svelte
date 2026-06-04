<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>OpenDiary</title>
</svelte:head>

{@render children()}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(:root) {
		--bg: #111;
		--surface: #1c1c1e;
		--surface2: #2c2c2e;
		--accent: #f5c542;
		--text: #f0f0f0;
		--text-muted: #888;
		--radius: 12px;
		--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	}

	:global(body) {
		background: var(--bg);
		color: var(--text);
		font-family: var(--font);
		min-height: 100dvh;
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
</style>
