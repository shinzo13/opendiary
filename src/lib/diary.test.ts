import { describe, it, expect } from 'vitest';
import {
	parseDate,
	fmtShort,
	daysBetween,
	moodCounts,
	moodSeries,
	buildMonth,
	MOODS,
	MOOD_CHOICES,
	MOOD_SCORES,
	type Entry
} from './diary';

function entry(date: string, mood: string | null = null): Entry {
	return {
		id: date,
		date,
		description: 'x',
		body: '',
		mood,
		coverFilename: 'x.jpg',
		photoCount: 1,
		trackTitle: null,
		trackArtist: null,
		trackCover: null
	};
}

describe('parseDate', () => {
	it('parses an ISO date into a local date at noon (no tz day-shift)', () => {
		const d = parseDate('2026-06-05');
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(5); // June, 0-indexed
		expect(d.getDate()).toBe(5);
		expect(d.getHours()).toBe(12);
	});
});

describe('fmtShort', () => {
	it('formats as "Mon D"', () => {
		expect(fmtShort('2026-06-05')).toBe('Jun 5');
		expect(fmtShort('2026-01-31')).toBe('Jan 31');
	});
});

describe('daysBetween', () => {
	it('counts whole days, ignoring time of day', () => {
		expect(daysBetween(parseDate('2026-06-01'), parseDate('2026-06-08'))).toBe(7);
	});
	it('is zero for the same day', () => {
		expect(daysBetween(parseDate('2026-06-05'), parseDate('2026-06-05'))).toBe(0);
	});
	it('is negative when b precedes a', () => {
		expect(daysBetween(parseDate('2026-06-10'), parseDate('2026-06-05'))).toBe(-5);
	});
});

describe('moodCounts', () => {
	it('counts known moods and sorts by frequency desc', () => {
		const entries = [
			entry('2026-06-01', 'calm'),
			entry('2026-06-02', 'happy'),
			entry('2026-06-03', 'happy'),
			entry('2026-06-04', 'happy'),
			entry('2026-06-05', 'calm')
		];
		expect(moodCounts(entries)).toEqual([
			['happy', 3],
			['calm', 2]
		]);
	});
	it('ignores null and unknown mood keys', () => {
		const entries = [entry('2026-06-01', null), entry('2026-06-02', 'not-a-mood'), entry('2026-06-03', 'sad')];
		expect(moodCounts(entries)).toEqual([['sad', 1]]);
	});
	it('returns an empty array when there are no moods', () => {
		expect(moodCounts([entry('2026-06-01')])).toEqual([]);
	});
});

describe('buildMonth', () => {
	it('builds full weeks padded with nulls and tags days that have entries', () => {
		const entries = [entry('2026-06-05', 'happy')];
		const weeks = buildMonth(2026, 5, entries); // June 2026

		// every week has 7 cells
		for (const w of weeks) expect(w).toHaveLength(7);

		// June 1 2026 is a Monday → one leading null
		expect(weeks[0][0]).toBeNull();
		expect(weeks[0][1]).toEqual({ d: 1, entry: null });

		// the 5th carries its entry
		const cells = weeks.flat();
		const fifth = cells.find((c) => c && c.d === 5);
		expect(fifth?.entry?.id).toBe('2026-06-05');

		// all 30 days are present
		const days = cells.filter((c) => c !== null).map((c) => c!.d);
		expect(days).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
	});
});

describe('mood data', () => {
	it('every offered mood choice has a palette entry', () => {
		for (const m of MOOD_CHOICES) {
			expect(MOODS[m]).toBeDefined();
			expect(MOODS[m].color).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it('every mood in the palette carries a score inside 0..10', () => {
		for (const m of Object.keys(MOODS)) {
			expect(MOOD_SCORES[m]).toBeDefined();
			expect(MOOD_SCORES[m]).toBeGreaterThanOrEqual(0);
			expect(MOOD_SCORES[m]).toBeLessThanOrEqual(10);
		}
	});

	it('keeps awful at the bottom and happy/excited at the top', () => {
		const scores = Object.values(MOOD_SCORES);
		expect(MOOD_SCORES.awful).toBe(Math.min(...scores));
		expect(MOOD_SCORES.happy).toBe(Math.max(...scores));
		expect(MOOD_SCORES.excited).toBe(Math.max(...scores));
	});
});

describe('moodSeries', () => {
	it('returns scored days oldest first with day offsets from the first one', () => {
		const series = moodSeries([entry('2026-06-10', 'sad'), entry('2026-06-05', 'happy')]);
		expect(series.map((p) => p.date)).toEqual(['2026-06-05', '2026-06-10']);
		expect(series.map((p) => p.dayIndex)).toEqual([0, 5]);
		expect(series[0].score).toBe(MOOD_SCORES.happy);
		expect(series[0].color).toBe(MOODS.happy.color);
	});

	it('skips entries without a usable mood', () => {
		const series = moodSeries([entry('2026-06-01', null), entry('2026-06-02', 'not-a-mood')]);
		expect(series).toEqual([]);
	});

	it('collapses a day to its newest entry and counts the rest', () => {
		const newest = { ...entry('2026-06-05', 'happy'), id: 'newest' };
		const older = { ...entry('2026-06-05', 'sad'), id: 'older' };
		const series = moodSeries([newest, older]);
		expect(series).toHaveLength(1);
		expect(series[0].id).toBe('newest');
		expect(series[0].sameDay).toBe(2);
	});
});
