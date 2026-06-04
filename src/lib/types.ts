export interface DiaryEntry {
	id: string;
	date: string; // ISO date: "2026-06-04"
	description: string;
	body: string;
	imageBlob: Blob;
	createdAt: number;
}
