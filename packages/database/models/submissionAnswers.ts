import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

import { submissionsTable } from "./submissions";

export const submissionAnswersTable = pgTable(
    "submission_answers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        submissionId: uuid("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),

        fieldId: text("field_id").notNull(),
        
        valueJson: jsonb("value_json").notNull(),
        valueText: text("value_text"),

        isValid: boolean("is_valid").notNull().default(true),
    },
    (table) => ({
        uniqueSubmissionField: unique().on(table.submissionId, table.fieldId),
    })
);