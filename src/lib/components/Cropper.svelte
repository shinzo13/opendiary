<script lang="ts">
	// square (1:1) image cropper — pan + zoom, exports a 1024px jpeg File
	let {
		src,
		onconfirm,
		oncancel
	}: { src: string; onconfirm: (file: File) => void; oncancel: () => void } = $props();

	let frame: HTMLDivElement;
	let imgEl: HTMLImageElement;

	let nw = $state(0);
	let nh = $state(0);
	let V = $state(320); // viewport (frame) size in px
	let baseScale = $state(1);
	let zoom = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let rot = $state(0);
	let ready = $state(false);

	const s = $derived(baseScale * zoom);
	const dispW = $derived(nw * s);
	const dispH = $derived(nh * s);
	const left = $derived(V / 2 + tx - dispW / 2);
	const top = $derived(V / 2 + ty - dispH / 2);

	function clampPan() {
		const visW = rot % 180 === 0 ? nw * s : nh * s;
		const visH = rot % 180 === 0 ? nh * s : nw * s;
		const maxX = Math.max(0, (visW - V) / 2);
		const maxY = Math.max(0, (visH - V) / 2);
		tx = Math.min(maxX, Math.max(-maxX, tx));
		ty = Math.min(maxY, Math.max(-maxY, ty));
	}

	function rotate() {
		rot = (rot + 90) % 360;
		clampPan();
	}

	function onImgLoad() {
		nw = imgEl.naturalWidth;
		nh = imgEl.naturalHeight;
		V = frame.clientWidth;
		baseScale = V / Math.min(nw, nh); // cover the square
		zoom = 1;
		tx = 0;
		ty = 0;
		rot = 0;
		clampPan();
		ready = true;
	}

	function onZoom(e: Event) {
		zoom = +(e.currentTarget as HTMLInputElement).value;
		clampPan();
	}

	let dragging = false;
	let sx = 0,
		sy = 0,
		stx = 0,
		sty = 0;

	function onDown(e: PointerEvent) {
		dragging = true;
		sx = e.clientX;
		sy = e.clientY;
		stx = tx;
		sty = ty;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		tx = stx + (e.clientX - sx);
		ty = sty + (e.clientY - sy);
		clampPan();
	}
	function onUp() {
		dragging = false;
	}

	function confirm() {
		const OUT = 1024;
		const f = OUT / V;
		const canvas = document.createElement('canvas');
		canvas.width = OUT;
		canvas.height = OUT;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, OUT, OUT);
		const cx = (V / 2 + tx) * f;
		const cy = (V / 2 + ty) * f;
		ctx.translate(cx, cy);
		ctx.rotate((rot * Math.PI) / 180);
		ctx.drawImage(imgEl, (-dispW * f) / 2, (-dispH * f) / 2, dispW * f, dispH * f);
		canvas.toBlob(
			(blob) => {
				if (blob) onconfirm(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
			},
			'image/jpeg',
			0.9
		);
	}
</script>

<div class="crop-backdrop" role="presentation">
	<div class="crop-sheet">
		<div class="crop-title">crop to square</div>

		<div
			class="frame"
			role="application"
			aria-label="drag to reposition, slider to zoom"
			bind:this={frame}
			onpointerdown={onDown}
			onpointermove={onMove}
			onpointerup={onUp}
			onpointercancel={onUp}
		>
			<img
				bind:this={imgEl}
				{src}
				alt=""
				onload={onImgLoad}
				draggable="false"
				class:ready
				style="left: {left}px; top: {top}px; width: {dispW}px; height: {dispH}px; transform: rotate({rot}deg);"
			/>
			<div class="frame-grid"></div>
		</div>

		<div class="tools">
			<button type="button" class="rotate" onclick={rotate} aria-label="rotate" title="rotate">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="23 4 23 10 17 10" />
					<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
				</svg>
			</button>
			<input
				class="zoom"
				type="range"
				min="1"
				max="4"
				step="0.01"
				value={zoom}
				oninput={onZoom}
				aria-label="zoom"
			/>
		</div>

		<div class="crop-actions">
			<button type="button" class="btn ghost" onclick={oncancel}>cancel</button>
			<button type="button" class="btn primary" onclick={confirm} disabled={!ready}>use photo</button>
		</div>
	</div>
</div>

<style>
	.crop-backdrop {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: grid;
		place-items: center;
		padding: 20px;
		background: rgba(5, 5, 5, 0.62);
		backdrop-filter: blur(10px);
		animation: crop-fade 0.2s ease;
	}
	@keyframes crop-fade { from { opacity: 0; } }

	.crop-sheet {
		width: 100%;
		max-width: 420px;
		background: var(--panel);
		border: 1px solid var(--panel-line);
		border-radius: 24px;
		padding: 20px;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
		animation: crop-pop 0.26s cubic-bezier(0.2, 0.7, 0.3, 1);
	}
	@keyframes crop-pop { from { opacity: 0; transform: translateY(14px) scale(0.985); } }

	.crop-title {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
		margin-bottom: 14px;
	}

	.frame {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		border-radius: 14px;
		background: #000;
		touch-action: none;
		cursor: grab;
	}
	.frame:active { cursor: grabbing; }

	.frame img {
		position: absolute;
		max-width: none;
		user-select: none;
		opacity: 0;
	}
	.frame img.ready { opacity: 1; }

	.frame-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px);
		background-size: 33.333% 33.333%;
		background-position: -1px -1px;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 18px 0 4px;
	}

	.rotate {
		flex: none;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--text);
		transition: 0.15s;
	}
	.rotate:hover { border-color: var(--accent); color: var(--accent); }
	.rotate:active { transform: scale(0.92); }

	.zoom {
		flex: 1;
		accent-color: var(--accent);
	}

	.crop-actions { display: flex; gap: 10px; margin-top: 12px; }
	.btn {
		flex: 1;
		padding: 12px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 700;
		font-family: inherit;
		border: 1px solid var(--line);
		background: transparent;
		color: var(--text);
		transition: 0.15s;
	}
	.btn.primary { background: var(--accent); color: #1a1304; border-color: var(--accent); }
	.btn.primary:hover { filter: brightness(1.06); }
	.btn.primary:disabled { opacity: 0.45; }
	.btn.ghost:hover { border-color: var(--accent); }
</style>
