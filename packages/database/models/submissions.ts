import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { formsTable } from "./form";
import { formVersionsTable } from "./formVersion";
import { usersTable } from "./user";
import { submissionStatusEnum } from "./enum";

export const submissionsTable = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    
    versionId: uuid("version_id").references(() => formVersionsTable.id).notNull(),
    respondentId: uuid("respondent_id").references(() => usersTable.id),

    status: submissionStatusEnum("status").notNull().default("In_PROGRESS"),
    
    durationMs: integer("duration_ms"),

    ipHash: text("ip_hash"),
    unHash: text("un_hash"),

    startedAt: timestamp("started_at",{withTimezone: true}),
    submittedAt: timestamp("submitted_at",{withTimezone: true}).defaultNow().notNull(),
    },
);

