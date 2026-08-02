// shared diary helpers: mood palette, date + calendar + stats utilities.
// used by client-side panels and entry views.

export type Mood = { label: string; color: string };

export const MOODS: Record<string, Mood> = {
	happy: { label: 'happy', color: '#f3c24a' },
	excited: { label: 'excited', color: '#f0934a' },
	calm: { label: 'calm', color: '#7cc0ab' },
	grateful: { label: 'grateful', color: '#a9c08a' },
	weird: { label: 'weird', color: '#d06b9e' },
	derealization: { label: 'derealization', color: '#a099b8' },
	melancholy: { label: 'melancholy', color: '#8a7ca8' },
	sad: { label: 'sad', color: '#6f8bbf' },
	anxious: { label: 'anxious', color: '#d0a83f' },
	angry: { label: 'angry', color: '#cf5043' },
	awful: { label: 'awful', color: '#9e3b3b' },
	apathetic: { label: 'apathetic', color: '#8a8f96' },
	bored: { label: 'bored', color: '#6f7d82' },
	exhausted: { label: 'exhausted', color: '#9a8f7a' },
	drunk: { label: 'drunk', color: '#c06bd0' },
	high: { label: 'high', color: '#6fbf73' },
	hungover: { label: 'hungover', color: '#8f7a5a' },
	wired: { label: 'wired', color: '#45b8c4' },
	sick: { label: 'sick', color: '#9aa05a' }
};

// moods offered when creating an entry (full spectrum)
// grateful/wired stay in MOODS so old entries still render, but are no longer offered
export const MOOD_CHOICES = [
	'happy',
	'excited',
	'calm',
	'weird',
	'derealization',
	'melancholy',
	'sad',
	'anxious',
	'angry',
	'awful',
	'apathetic',
	'bored',
	'exhausted',
	'drunk',
	'high',
	'hungover',
	'sick'
] as const;

// how "good" a mood is, 0 (worst) .. 10 (best) — drives the mood trend chart
export const MOOD_SCORES: Record<string, number> = {
	happy: 10,
	excited: 10,
	grateful: 9,
	high: 8.5,
	drunk: 8,
	derealization: 7.5,
	calm: 6.5,
	wired: 6,
	weird: 5,
	bored: 4.5,
	apathetic: 4,
	melancholy: 3.8,
	exhausted: 3.5,
	sad: 3,
	hungover: 3,
	anxious: 2.5,
	sick: 2.5,
	angry: 2,
	awful: 0
};

export const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTHS_SHORT = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
export const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// an entry as it reaches the client (date is an ISO 'YYYY-MM-DD' string)
export type Entry = {
	id: string;
	date: string;
	description: string;
	body: string;
	mood: string | null;
	coverFilename: string;
	photoCount: number;
	trackTitle: string | null;
	trackArtist: string | null;
	trackCover: string | null;
};

// parse 'YYYY-MM-DD' into a local-noon Date (avoids tz day-shift)
export function parseDate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d, 12);
}

export function fmtShort(iso: string): string {
	const d = parseDate(iso);
	return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
}

export function daysBetween(a: Date, b: Date): number {
	const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
	const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((db.getTime() - da.getTime()) / 86400000);
}

// mood key -> count, sorted desc
export function moodCounts(entries: Entry[]): [string, number][] {
	const c: Record<string, number> = {};
	for (const e of entries) {
		if (e.mood && MOODS[e.mood]) c[e.mood] = (c[e.mood] || 0) + 1;
	}
	return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

// one point per calendar day that has a scored mood, oldest first.
// days holding several entries keep the newest one (entries arrive newest-first).
export type MoodPoint = {
	id: string;
	date: string;
	mood: string;
	color: string;
	score: number;
	description: string;
	sameDay: number;
	dayIndex: number;
};

export function moodSeries(entries: Entry[]): MoodPoint[] {
	const byDate = new Map<string, { entry: Entry; sameDay: number }>();
	for (const e of entries) {
		if (!e.mood || !MOODS[e.mood] || MOOD_SCORES[e.mood] === undefined) continue;
		const seen = byDate.get(e.date);
		if (seen) seen.sameDay++;
		else byDate.set(e.date, { entry: e, sameDay: 1 });
	}

	const days = [...byDate.values()].sort((a, b) => a.entry.date.localeCompare(b.entry.date));
	if (days.length === 0) return [];

	const first = parseDate(days[0].entry.date);
	return days.map(({ entry, sameDay }) => ({
		id: entry.id,
		date: entry.date,
		mood: entry.mood!,
		color: MOODS[entry.mood!].color,
		score: MOOD_SCORES[entry.mood!],
		description: entry.description,
		sameDay,
		dayIndex: daysBetween(first, parseDate(entry.date))
	}));
}

// blend two '#rrggbb' colors, t = 0 gives a, t = 1 gives b
export function mixHex(a: string, b: string, t: number): string {
	const k = Math.min(1, Math.max(0, t));
	const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
	const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k));
	return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export type Cell = { d: number; entry: Entry | null } | null;

// build a month grid: weeks of 7 cells (null = padding)
export function buildMonth(year: number, month: number, entries: Entry[]): Cell[][] {
	const first = new Date(year, month, 1).getDay();
	const days = new Date(year, month + 1, 0).getDate();
	const byDay: Record<number, Entry> = {};
	for (const e of entries) {
		const d = parseDate(e.date);
		if (d.getFullYear() === year && d.getMonth() === month) byDay[d.getDate()] = e;
	}
	const cells: Cell[] = [];
	for (let i = 0; i < first; i++) cells.push(null);
	for (let d = 1; d <= days; d++) cells.push({ d, entry: byDay[d] || null });
	while (cells.length % 7 !== 0) cells.push(null);
	const weeks: Cell[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}
