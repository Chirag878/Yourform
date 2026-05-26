import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enum";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 80 }).notNull(),

  email: varchar("email", { length: 322 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),

  passwordHash: varchar("password_hash", { length: 255 }),

  profileImageUrl: text("profile_image_url"),

  role: userRoleEnum("role").default("User"),

  provider: varchar("provider", { length: 50 })
  .default("credentials")
  .notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
