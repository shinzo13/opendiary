import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, text, date, timestamp, boolean, unique } from 'drizzle-orm/pg-core';

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
	imageFilename: text('image_filename').notNull(),
	createdAt: timestamp('created_at').defaultNow()
}, (t) => ({
	userDateUnique: unique('entries_user_id_date_unique').on(t.userId, t.date)
}));

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema: { users, entries, emailVerifications } });
