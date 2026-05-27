import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { formGenreEnum, formStatusEnum, formVisibilityEnum, submissionAuthModeEnum } from "./enum";
import { usersTable } from "./user";

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    status: formStatusEnum("status").default("Draft").notNull(),
    visibility: formVisibilityEnum("visibility").default("Unlisted").notNull(),

    responseAuthMode: submissionAuthModeEnum("response_auth_mode").default("PUBLIC").notNull(),
    genre: formGenreEnum("genre").default("CUSTOM").notNull(),

    customGenre: varchar("custom_genre", { length: 120 }),
    templateKey: varchar("template_key", { length: 120 }),
    themeVariant: varchar("theme_variant", { length: 80 }).default("mist-valley").notNull(),
    settingsJson: jsonb("settings_json").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),

    slug: varchar("slug", { length: 255 }).notNull().unique(),
    shareToken: varchar("share_token", { length: 80 })
      .notNull()
      .default(sql`replace(gen_random_uuid()::text, '-', '')`),

    isPublished: boolean("is_published").default(false).notNull(),

    createdBy: uuid("created_by")
      .references(() => usersTable.id)
      .notNull(),

    currentVersionId: uuid("current_version_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    formsCreatedByIdx: index("forms_created_by_idx").on(table.createdBy),
    formsStatusIdx: index("forms_status_idx").on(table.status),
    formsVisibilityIdx: index("forms_visibility_idx").on(table.visibility),
    formsShareTokenUnique: uniqueIndex("forms_share_token_unique").on(table.shareToken),
  }),
);

