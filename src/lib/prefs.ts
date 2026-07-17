// client-side ui preferences (localStorage)
const KEY = 'od_prefs';

export type Prefs = { showTracks: boolean };

const defaults: Prefs = { showTracks: false };

export function loadPrefs(): Prefs {
	try {
		return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
	} catch {
		return { ...defaults };
	}
}

export function savePrefs(p: Prefs) {
	localStorage.setItem(KEY, JSON.stringify(p));
}
