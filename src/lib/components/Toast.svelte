<script lang="ts">
	import { onMount } from 'svelte';

	let { message, variant = 'success' }: { message: string; variant?: 'success' | 'error' } =
		$props();
	let visible = $state(true);

	onMount(() => {
		const t = setTimeout(() => (visible = false), variant === 'error' ? 3180 : 3200);
		return () => clearTimeout(t);
	});
</script>

{#if visible}
	<div class="toast {variant}" role={variant === 'error' ? 'alert' : 'status'}>
		{#if variant === 'error'}
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="13" />
				<line x1="12" y1="16.5" x2="12" y2="16.5" />
			</svg>
		{:else}
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{/if}
		{message}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 300;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 13px 22px;
		border-radius: 40px;
		font-size: 14px;
		font-weight: 600;
		max-width: calc(100vw - 32px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
	}

	.toast.success {
		background: var(--accent);
		color: #1a1304;
		white-space: nowrap;
		animation: in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both,
			out 0.3s ease 2.9s both;
	}

	.toast.error {
		background: #e5484d;
		color: #fff;
		animation: in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both,
			out 0.18s ease 3s both;
	}

	.toast svg { flex: none; }

	@keyframes in {
		from { opacity: 0; transform: translateX(-50%) translateY(-14px) scale(0.96); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
	}

	@keyframes out {
		from { opacity: 1; }
		to   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
	}
</style>
