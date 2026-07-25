<script lang="ts">
	// swipeable square viewer: the cover fills the frame, taller/wider photos are
	// letterboxed over a blurred copy of themselves
	let { photos, alt }: { photos: string[]; alt: string } = $props();

	let track = $state<HTMLElement>();
	let index = $state(0);

	function onScroll() {
		if (!track) return;
		index = Math.round(track.scrollLeft / track.clientWidth);
	}

	function go(to: number) {
		if (!track) return;
		const next = Math.min(photos.length - 1, Math.max(0, to));
		track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
	}

	function onKeydown(e: KeyboardEvent) {
		if (photos.length < 2) return;
		if (e.key === 'ArrowLeft') go(index - 1);
		else if (e.key === 'ArrowRight') go(index + 1);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="carousel">
	<div class="track" bind:this={track} onscroll={onScroll}>
		{#each photos as filename, i (filename)}
			<div class="slide">
				<img class="backdrop" src="/api/uploads/{filename}" alt="" aria-hidden="true" />
				<img
					class="photo"
					src="/api/uploads/{filename}"
					alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
					loading={i === 0 ? 'eager' : 'lazy'}
				/>
			</div>
		{/each}
	</div>

	{#if photos.length > 1}
		<button class="arrow left" onclick={() => go(index - 1)} disabled={index === 0} aria-label="previous photo">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<button class="arrow right" onclick={() => go(index + 1)} disabled={index === photos.length - 1} aria-label="next photo">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</button>

		{#if photos.length > 8}
			<span class="counter">{index + 1} / {photos.length}</span>
		{:else}
			<div class="dots">
				{#each photos as filename, i (filename)}
					<button class="dot" class:on={i === index} onclick={() => go(i)} aria-label="photo {i + 1}"></button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.carousel {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: var(--surface);
		animation: hero-reveal 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) both;
	}

	@keyframes hero-reveal {
		from { opacity: 0; transform: scale(1.06); }
	}

	.track {
		display: flex;
		height: 100%;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
		overscroll-behavior-x: contain;
	}
	.track::-webkit-scrollbar { width: 0; height: 0; }

	.slide {
		position: relative;
		flex: 0 0 100%;
		height: 100%;
		scroll-snap-align: center;
		scroll-snap-stop: always;
		overflow: hidden;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(28px) brightness(0.55);
		transform: scale(1.15);
	}

	.photo {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 36px; height: 36px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(8px);
		color: #fff;
		opacity: 0;
		transition: opacity 0.2s;
		cursor: pointer;
	}
	.arrow.left { left: 10px; }
	.arrow.right { right: 10px; }
	.arrow:disabled { opacity: 0 !important; pointer-events: none; }
	.carousel:hover .arrow, .arrow:focus-visible { opacity: 1; }

	.dots {
		position: absolute;
		left: 0; right: 0; bottom: 12px;
		display: flex;
		justify-content: center;
		gap: 6px;
	}

	.dot {
		width: 6px; height: 6px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.45);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		transition: 0.2s;
		cursor: pointer;
	}
	.dot.on { background: #fff; transform: scale(1.35); }

	.counter {
		position: absolute;
		right: 12px; bottom: 12px;
		padding: 4px 10px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		color: #fff;
		font-size: 11.5px;
		font-weight: 700;
	}

	/* touch devices have no hover — swiping is the affordance there */
	@media (hover: none) {
		.arrow { display: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.carousel { animation: none; }
	}
</style>
