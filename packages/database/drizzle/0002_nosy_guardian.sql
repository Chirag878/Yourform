ALTER TYPE "public"."genre" ADD VALUE 'SPORTS' BEFORE 'CUSTOM';--> statement-breakpoint
ALTER TYPE "public"."genre" ADD VALUE 'ANIME' BEFORE 'CUSTOM';--> statement-breakpoint
ALTER TYPE "public"."genre" ADD VALUE 'TV' BEFORE 'CUSTOM';--> statement-breakpoint
ALTER TYPE "public"."genre" ADD VALUE 'TRAVEL' BEFORE 'CUSTOM';--> statement-breakpoint
ALTER TYPE "public"."genre" ADD VALUE 'CONTACT' BEFORE 'CUSTOM';--> statement-breakpoint
ALTER TYPE "public"."visibility" ADD VALUE 'Unlisted' BEFORE 'Private';--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "visibility" SET DEFAULT 'Unlisted';--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "template_key" varchar(120);--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "theme_variant" varchar(80) DEFAULT 'mist-valley' NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "settings_json" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "share_token" varchar(80) DEFAULT replace(gen_random_uuid()::text, '-', '') NOT NULL;--> statement-breakpoint
CREATE INDEX "forms_created_by_idx" ON "forms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "forms_status_idx" ON "forms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "forms_visibility_idx" ON "forms" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "forms_share_token_unique" ON "forms" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "form_versions_form_id_idx" ON "form_versions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "submissions_form_id_idx" ON "submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "submissions_version_id_idx" ON "submissions" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "submissions_submitted_at_idx" ON "submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "submission_answers_field_id_idx" ON "submission_answers" USING btree ("field_id");