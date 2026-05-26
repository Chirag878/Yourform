import {pgTable, uuid, text, timestamp, boolean, varchar} from "drizzle-orm/pg-core";
import {usersTable} from "./user";
import {formStatusEnum, formVisibilityEnum, formGenreEnum, submissionAuthModeEnum} from "./enum";

export const formsTable = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  status: formStatusEnum("status").default("Draft").notNull(),
  visibility: formVisibilityEnum("visibility").default("Public").notNull(),

  responseAuthMode: submissionAuthModeEnum("response_auth_mode").default("PUBLIC").notNull(), 
  genre: formGenreEnum("genre").default("CUSTOM").notNull(),

  customGenre: varchar("custom_genre", { length: 120 }),


  slug: varchar("slug", { length: 255 }).notNull().unique(),

  isPublished: boolean("is_published").default(false).notNull(),

  createdBy: uuid("created_by")
    .references(() => usersTable.id).notNull(),

  currentVersionId: uuid("current_version_id"),  

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});


