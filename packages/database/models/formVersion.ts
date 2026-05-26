import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { formsTable } from "./form";
import { usersTable } from "./user";

export const formVersionsTable = pgTable(
  "form_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    version: integer("version").notNull(),
    
    schemaJson: jsonb("schema_json").notNull(),
    logicJson: jsonb("logic_json").notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id),
    
   createAt: timestamp("created_at",{withTimezone: true}).notNull().defaultNow(),
   
   publishedAt: timestamp("published_at",{withTimezone: true}),

  },
  (table) => {
    return {
      uniqueFormVersion: unique("unique_form_version").on(table.formId, table.version),
    };
  });