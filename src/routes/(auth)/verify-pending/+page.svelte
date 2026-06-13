<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const errors: Record<string, string> = {
		expired: 'that link has expired — we sent you a fresh one',
		invalid: 'that link is invalid — request a new one below'
	};
	const notice = $derived(data.error ? errors[data.error] ?? null : null);
</script>

{#if form?.error}
	{#key form}
		<Toast message={form.error} variant="error" />
	{/key}
{/if}
{#if form?.sent}
	{#key form}
		<Toast message="email sent — check your inbox" variant="success" />
	{/key}
{/if}

<div class="auth-page">
	<h1>confirm your email</h1>

	<p class="lead">
		we sent a confirmation link to <strong>{data.email}</strong>.
		click it to start writing.
	</p>

	{#if notice}
		<p class="notice">{notice}</p>
	{/if}

	<form method="POST" action="?/resend">
		<button type="submit">resend email</button>
	</form>

	<p class="switch">wrong address? <a href="/register">sign up again</a></p>
	<p class="switch"><a href="/login">back to sign in</a></p>
</div>

<style>
	.auth-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 32px 24px;
		text-align: center;
	}

	h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; }

	.lead {
		max-width: 360px;
		font-size: 15px;
		line-height: 1.5;
		color: var(--text-muted);
		margin-bottom: 24px;
	}
	.lead strong { color: var(--text); }

	.notice {
		max-width: 360px;
		font-size: 13px;
		color: var(--accent);
		margin-bottom: 20px;
	}

	form { width: 100%; max-width: 360px; }

	button {
		width: 100%;
		padding: 14px;
		background: var(--accent);
		color: #111;
		border: none;
		border-radius: var(--radius);
		font-size: 15px;
		font-weight: 600;
	}

	.switch { margin-top: 20px; font-size: 14px; color: var(--text-muted); }
	.switch a { color: var(--accent); }
</style>
