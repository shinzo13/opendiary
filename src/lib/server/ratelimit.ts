// in-memory sliding-window rate limiter; fine for a single-process deploy
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	if (list.length >= limit) {
		hits.set(key, list);
		return false;
	}
	list.push(now);
	hits.set(key, list);
	return true;
}

setInterval(() => {
	const now = Date.now();
	for (const [key, list] of hits) {
		const fresh = list.filter((t) => now - t < 300000);
		if (fresh.length === 0) hits.delete(key);
		else hits.set(key, fresh);
	}
}, 300000).unref?.();
