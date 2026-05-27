CREATE TYPE "public"."genre" AS ENUM('FEEDBACK', 'SURVEY', 'EVENTS', 'JOB', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('Draft', 'Published', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('Public', 'Private');--> statement-breakpoint
CREATE TYPE "public"."response_auth_mode" AS ENUM('PUBLIC', 'AUTHENTICATED');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('In_PROGRESS', 'COMPLETED', 'PARTIAL', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('Creator', 'User');--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "form_status" DEFAULT 'Draft' NOT NULL,
	"visibility" "visibility" DEFAULT 'Public' NOT NULL,
	"response_auth_mode" "response_auth_mode" DEFAULT 'PUBLIC' NOT NULL,
	"genre" "genre" DEFAULT 'CUSTOM' NOT NULL,
	"custom_genre" varchar(120),
	"slug" varchar(255) NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "forms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"schema_json" jsonb NOT NULL,
	"logic_json" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "unique_form_version" UNIQUE("form_id","version")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"respondent_id" uuid,
	"status" "submission_status" DEFAULT 'In_PROGRESS' NOT NULL,
	"duration_ms" integer,
	"ip_hash" text,
	"un_hash" text,
	"started_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"field_id" text NOT NULL,
	"value_json" jsonb NOT NULL,
	"value_text" text,
	"is_valid" boolean DEFAULT true NOT NULL,
	CONSTRAINT "submission_answers_submission_id_field_id_unique" UNIQUE("submission_id","field_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(322);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'User';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" varchar(50) DEFAULT 'credentials' NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_version_id_form_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;