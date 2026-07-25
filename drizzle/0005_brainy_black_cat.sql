CREATE TABLE "entry_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "entry_photos" ADD CONSTRAINT "entry_photos_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entry_photos_entry_id_position_idx" ON "entry_photos" USING btree ("entry_id","position");--> statement-breakpoint
INSERT INTO "entry_photos" ("entry_id", "filename", "position") SELECT "id", "image_filename", 0 FROM "entries";--> statement-breakpoint
ALTER TABLE "entries" DROP COLUMN "image_filename";