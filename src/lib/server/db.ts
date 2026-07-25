import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, text, date, timestamp, boolean, integer, index, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	emailVerified: boolean('email_verified').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow()
});

export const emailVerifications = pgTable('email_verifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const entries = pgTable('entries', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	date: date('date').notNull(),
	description: text('description').notNull(),
	body: text('body').notNull().default(''),
	mood: text('mood'),
	trackTitle: text('track_title'),
	trackArtist: text('track_artist'),
	trackCover: text('track_cover'),
	createdAt: timestamp('created_at').defaultNow()
}, (t) => ({
	userDateUnique: unique('entries_user_id_date_unique').on(t.userId, t.date)
}));

// photos of an entry, ordered by position; position 0 is the cover
export const entryPhotos = pgTable('entry_photos', {
	id: uuid('id').primaryKey().defaultRandom(),
	entryId: uuid('entry_id')
		.notNull()
		.references(() => entries.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	position: integer('position').notNull().default(0),
	createdAt: timestamp('created_at').defaultNow()
}, (t) => ({
	entryPositionIdx: index('entry_photos_entry_id_position_idx').on(t.entryId, t.position)
}));

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema: { users, entries, entryPhotos, emailVerifications } });
