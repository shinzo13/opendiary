import { error, json } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

// proxy to the public deezer search api (no auth needed)
export const GET: RequestHandler = async ({ url, locals, fetch }) => {
	if (!locals.userId) error(401);
	if (!rateLimit(`tracks:${locals.userId}`, 20, 60000)) error(429, 'slow down');
	const q = url.searchParams.get('q')?.trim();
	if (!q) return json({ tracks: [] });

	const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`);
	if (!res.ok) error(502, 'deezer search failed');
	const data = await res.json();

	const tracks = ((data.data ?? []) as any[]).map((t) => ({
		title: t.title as string,
		artist: t.artist?.name as string,
		cover: (t.album?.cover_medium ?? t.album?.cover) as string
	}));

	return json({ tracks });
};
