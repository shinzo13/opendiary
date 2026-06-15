// shared diary helpers: mood palette, date + calendar + stats utilities.
// used by client-side panels and entry views.

export type Mood = { label: string; color: string };

export const MOODS: Record<string, Mood> = {
	happy: { label: 'happy', color: '#f3c24a' },
	excited: { label: 'excited', color: '#f0934a' },
	calm: { label: 'calm', color: '#7cc0ab' },
	grateful: { label: 'grateful', color: '#a9c08a' },
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
	wired: { label: 'wired', color: '#45b8c4' }
};

// moods offered when creating an entry (full spectrum)
export const MOOD_CHOICES = [
	'happy',
	'excited',
	'calm',
	'grateful',
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
	'wired'
] as const;

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
	imageFilename: string;
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
