import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { scryptSync, randomBytes } from "node:crypto";
import { db } from "./client";
import { usersTable, formsTable, formVersionsTable } from "./schema";
import { eq } from "drizzle-orm";
import { templateCatalog } from "../services/templates/catalog";

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "form";

const createShareToken = () => randomBytes(18).toString("base64url");

async function main() {
  console.log("🌱 Starting template database seed...");

  // 1. Create default creator user
  const email = "creator@yourform.com";
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  let userId: string;

  if (existingUser) {
    console.log(`👤 Creator user already exists with ID: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    const [newUser] = await db
      .insert(usersTable)
      .values({
        fullName: "Demo Creator",
        email,
        emailVerified: true,
        passwordHash: hashPassword("password123"),
        role: "Creator",
      })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create demo user");
    }

    console.log(`👤 Created demo creator user: ${newUser.email} (${newUser.id})`);
    userId = newUser.id;
  }

  // 2. Seed forms from the template catalog
  console.log(`📋 Seeding templates as published forms...`);
  for (const template of templateCatalog) {
    // Check if form with this templateKey already exists for this user
    const [existingForm] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.templateKey, template.key))
      .limit(1);

    if (existingForm) {
      console.log(`⏩ Form for template '${template.key}' already seeded, skipping.`);
      continue;
    }

    const slug = `${slugify(template.title)}-${randomBytes(3).toString("hex")}`;
    const shareToken = createShareToken();

    try {
      await db.transaction(async (tx) => {
        // A. Insert Form
        const [form] = await tx
          .insert(formsTable)
          .values({
            title: template.title,
            description: template.description,
            status: "Published",
            visibility: "Public",
            responseAuthMode: "PUBLIC",
            genre: template.genre,
            templateKey: template.key,
            themeVariant: template.themeVariant,
            slug,
            shareToken,
            isPublished: true,
            createdBy: userId,
          })
          .returning();

        if (!form) throw new Error("Failed to insert form row");

        // B. Insert Form Version
        const [version] = await tx
          .insert(formVersionsTable)
          .values({
            formId: form.id,
            version: 1,
            schemaJson: template.definition,
            logicJson: {},
            createdBy: userId,
            publishedAt: new Date(),
          })
          .returning();

        if (!version) throw new Error("Failed to insert form version row");

        // C. Link current version to form
        await tx
          .update(formsTable)
          .set({ currentVersionId: version.id })
          .where(eq(formsTable.id, form.id));

        console.log(`✅ Seeded template: ${template.title} -> public URL: /f/${slug}`);
      });
    } catch (err) {
      console.error(`❌ Error seeding template '${template.key}':`, err);
    }
  }

  console.log("🌳 Database seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
