import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { compileToSubmissionSchema } from "@repo/database/compile-submission-schema";
import { db } from "@repo/database/client";
import { formDefinitionSchema, type FormDefinition, type ThemeVariant } from "@repo/database/form-definition";
import {
  formsTable,
  formVersionsTable,
  submissionAnswersTable,
  submissionsTable,
  usersTable,
} from "@repo/database/schema";
import { getTemplateByKey, templateCatalog } from "../templates";
import { createSubmissionRateLimiter } from "./rate-limit";
import { FormsServiceError } from "./errors";

type FormRow = typeof formsTable.$inferSelect;
type VersionRow = typeof formVersionsTable.$inferSelect;

const schemaCache = new Map<string, ReturnType<typeof compileToSubmissionSchema>>();
const payloadByteLimit = 200 * 1024;
const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 30;
const submissionRateLimiter = createSubmissionRateLimiter(rateLimitWindowMs, rateLimitMax);

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "form";

const createShareToken = () => randomBytes(18).toString("base64url");

const hashValue = (value?: string | null) =>
  createHash("sha256").update(value ?? "unknown").digest("hex");

const toValueText = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const parseDefinition = (definition: unknown): FormDefinition => formDefinitionSchema.parse(definition);

const defaultDefinition = (input: {
  title: string;
  description?: string | null;
  themeVariant?: ThemeVariant;
}): FormDefinition => ({
  title: input.title,
  description: input.description ?? undefined,
  category: "Custom",
  themeVariant: input.themeVariant ?? "mist-valley",
  fields: [
    {
      id: "email",
      kind: "email",
      label: "Email",
      required: true,
    },
    {
      id: "message",
      kind: "long-text",
      label: "Message",
      required: true,
      minLength: 10,
      maxLength: 1200,
    },
  ],
});

const publicTokenFor = (form: FormRow) => (form.visibility === "Unlisted" ? form.shareToken : form.slug);

class FormsService {
  public listTemplates() {
    return templateCatalog.map(({ definition, ...template }) => ({
      ...template,
      fieldsCount: definition.fields.length,
      defaultFields: definition.fields,
    }));
  }

  public async createDraft(input: {
    userId: string;
    title: string;
    description?: string | null;
    visibility?: "Public" | "Unlisted" | "Private";
    responseAuthMode?: "PUBLIC" | "AUTHENTICATED";
    themeVariant?: ThemeVariant;
    genre?: FormRow["genre"];
    templateKey?: string | null;
    definition?: FormDefinition;
  }) {
    const definition = parseDefinition(
      input.definition ??
        defaultDefinition({
          title: input.title,
          description: input.description,
          themeVariant: input.themeVariant,
        }),
    );

    const slug = `${slugify(input.title)}-${randomBytes(3).toString("hex")}`;
    const shareToken = createShareToken();

    const result = await db.transaction(async (tx) => {
      const [form] = await tx
        .insert(formsTable)
        .values({
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility ?? "Unlisted",
          responseAuthMode: input.responseAuthMode ?? "PUBLIC",
          genre: input.genre ?? "CUSTOM",
          templateKey: input.templateKey ?? null,
          themeVariant: input.themeVariant ?? definition.themeVariant,
          slug,
          shareToken,
          createdBy: input.userId,
        })
        .returning();

      if (!form) throw new Error("Unable to create form.");

      const [version] = await tx
        .insert(formVersionsTable)
        .values({
          formId: form.id,
          version: 1,
          schemaJson: definition,
          logicJson: {},
          createdBy: input.userId,
        })
        .returning();

      if (!version) throw new Error("Unable to create form version.");

      const [updatedForm] = await tx
        .update(formsTable)
        .set({ currentVersionId: version.id })
        .where(eq(formsTable.id, form.id))
        .returning();

      return { form: updatedForm ?? form, version, definition };
    });

    return this.serializeForm(result.form, result.version, result.definition);
  }

  public async createFromTemplate(input: {
    userId: string;
    templateKey: string;
    visibility?: "Public" | "Unlisted" | "Private";
    responseAuthMode?: "PUBLIC" | "AUTHENTICATED";
  }) {
    const template = getTemplateByKey(input.templateKey);
    if (!template) throw new FormsServiceError("Template not found.", "NOT_FOUND");

    return this.createDraft({
      userId: input.userId,
      title: template.title,
      description: template.description,
      visibility: input.visibility ?? "Unlisted",
      responseAuthMode: input.responseAuthMode ?? "PUBLIC",
      genre: template.genre,
      templateKey: template.key,
      themeVariant: template.themeVariant,
      definition: template.definition,
    });
  }

  public async updateDraftSchema(input: {
    userId: string;
    formId: string;
    definition: FormDefinition;
    visibility?: "Public" | "Unlisted" | "Private";
    responseAuthMode?: "PUBLIC" | "AUTHENTICATED";
    themeVariant?: ThemeVariant;
  }) {
    const definition = parseDefinition(input.definition);

    const result = await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formsTable)
        .where(and(eq(formsTable.id, input.formId), eq(formsTable.createdBy, input.userId)))
        .limit(1);

      if (!form) throw new FormsServiceError("Form not found.", "NOT_FOUND");
      if (form.status === "Closed") throw new FormsServiceError("Closed forms cannot be edited.", "FORBIDDEN");

      const [latest] = await tx
        .select()
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, input.formId))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      const [version] = await tx
        .insert(formVersionsTable)
        .values({
          formId: input.formId,
          version: (latest?.version ?? 0) + 1,
          schemaJson: definition,
          logicJson: {},
          createdBy: input.userId,
        })
        .returning();

      if (!version) throw new Error("Unable to create form version.");

      const [updatedForm] = await tx
        .update(formsTable)
        .set({
          title: definition.title,
          description: definition.description ?? null,
          visibility: input.visibility ?? form.visibility,
          responseAuthMode: input.responseAuthMode ?? form.responseAuthMode,
          themeVariant: input.themeVariant ?? definition.themeVariant,
          currentVersionId: version.id,
        })
        .where(eq(formsTable.id, form.id))
        .returning();

      return { form: updatedForm ?? form, version, definition };
    });

    schemaCache.delete(result.version.id);
    return this.serializeForm(result.form, result.version, result.definition);
  }

  public async publish(input: { userId: string; formId: string }) {
    const form = await this.getOwnedForm(input.userId, input.formId);
    const version = await this.getCurrentVersion(form);
    if (!version) throw new FormsServiceError("Form does not have a version to publish.", "BAD_REQUEST");

    await db.transaction(async (tx) => {
      await tx
        .update(formVersionsTable)
        .set({ publishedAt: new Date() })
        .where(eq(formVersionsTable.id, version.id));

      await tx
        .update(formsTable)
        .set({ status: "Published", isPublished: true })
        .where(eq(formsTable.id, form.id));
    });

    const [publishedForm] = await db.select().from(formsTable).where(eq(formsTable.id, form.id)).limit(1);
    return this.serializeForm(publishedForm ?? form, version, parseDefinition(version.schemaJson));
  }

  public async listMine(input: { userId: string; limit?: number; offset?: number }) {
    const limit = Math.min(Math.max(input.limit ?? 24, 1), 100);
    const offset = Math.max(input.offset ?? 0, 0);
    const forms = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.createdBy, input.userId))
      .orderBy(desc(formsTable.updatedAt), desc(formsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return Promise.all(
      forms.map(async (form) => {
        const [countRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionsTable)
          .where(eq(submissionsTable.formId, form.id));
        return {
          ...this.serializeFormMeta(form),
          responseCount: countRow?.count ?? 0,
        };
      }),
    );
  }

  public async getById(input: { userId: string; formId: string }) {
    const form = await this.getOwnedForm(input.userId, input.formId);
    const version = await this.getCurrentVersion(form);
    if (!version) throw new FormsServiceError("Form version not found.", "NOT_FOUND");
    return this.serializeForm(form, version, parseDefinition(version.schemaJson));
  }

  public async getPublicByToken(input: { token: string; userId?: string | null }) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(
        and(
          eq(formsTable.status, "Published"),
          eq(formsTable.isPublished, true),
          or(eq(formsTable.slug, input.token), eq(formsTable.shareToken, input.token)),
        ),
      )
      .limit(1);

    if (!form || form.visibility === "Private") throw new FormsServiceError("Form not found.", "NOT_FOUND");

    if (form.responseAuthMode === "AUTHENTICATED" && !input.userId) {
      return {
        form: this.serializeFormMeta(form),
        definition: null,
        requiresAuth: true,
      };
    }

    const version = await this.getCurrentVersion(form);
    if (!version) throw new FormsServiceError("Form version not found.", "NOT_FOUND");

    return {
      form: this.serializeFormMeta(form),
      versionId: version.id,
      definition: parseDefinition(version.schemaJson),
      requiresAuth: false,
    };
  }

  public async submit(input: {
    token: string;
    userId?: string | null;
    answers: Record<string, unknown>;
    durationMs?: number | null;
    startedAt?: string | null;
    honeypot?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (input.honeypot) throw new FormsServiceError("Submission rejected.", "BAD_REQUEST");
    if (Buffer.byteLength(JSON.stringify(input.answers), "utf8") > payloadByteLimit) {
      throw new FormsServiceError("Submission payload is too large.", "PAYLOAD_TOO_LARGE");
    }

    const publicForm = await this.getPublicByToken({ token: input.token, userId: input.userId });
    if (publicForm.requiresAuth || !publicForm.definition || !publicForm.versionId) {
      throw new FormsServiceError("You must be signed in to submit this form.", "UNAUTHORIZED");
    }

    const formId = publicForm.form.id;
    this.checkRateLimit(`${formId}:${hashValue(input.ip)}`);

    const schema =
      schemaCache.get(publicForm.versionId) ?? compileToSubmissionSchema(publicForm.definition);
    schemaCache.set(publicForm.versionId, schema);

    const parsed = schema.safeParse(input.answers);
    if (!parsed.success) {
      throw new FormsServiceError(parsed.error.issues.map((issue) => issue.message).join("; "), "BAD_REQUEST");
    }

    const submission = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(submissionsTable)
        .values({
          formId,
          versionId: publicForm.versionId,
          respondentId: input.userId ?? null,
          status: "COMPLETED",
          durationMs: input.durationMs ?? null,
          ipHash: hashValue(input.ip),
          unHash: hashValue(input.userAgent),
          startedAt: input.startedAt && !Number.isNaN(Date.parse(input.startedAt)) ? new Date(input.startedAt) : null,
        })
        .returning();

      if (!created) throw new Error("Unable to create submission.");

      const answersToInsert = publicForm.definition.fields
        .map((field) => ({
          submissionId: created.id,
          fieldId: field.id,
          valueJson: parsed.data[field.id],
          valueText: toValueText(parsed.data[field.id]),
          isValid: true,
        }))
        .filter((answer) => answer.valueJson !== undefined);

      if (answersToInsert.length > 0) {
        await tx.insert(submissionAnswersTable).values(answersToInsert);
      }

      return created;
    });

    // Dispatch confirmation email to respondent (if authenticated)
    let respondentEmail = null;
    if (input.userId) {
      const [respondent] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, input.userId))
        .limit(1);
      if (respondent) {
        respondentEmail = respondent.email;
      }
    }

    if (respondentEmail) {
      console.log(
        `\n[MAILER FALLBACK] Confirmation email sent to Responder (${respondentEmail}) for Form "${publicForm.form.title}":\n` +
        `Subject: Submission Captured: ${publicForm.form.title}\n` +
        `Hi! Your submission for the form "${publicForm.form.title}" was successfully recorded on ${submission.submittedAt.toISOString()}.\n`
      );
    }

    // Dispatch confirmation email to creator (always)
    if (publicForm.form.createdBy) {
      const [creator] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, publicForm.form.createdBy))
        .limit(1);

      if (creator) {
        console.log(
          `\n[MAILER FALLBACK] Confirmation email sent to Creator (${creator.email}) for Form "${publicForm.form.title}":\n` +
          `Subject: New Response Received for ${publicForm.form.title}\n` +
          `Hi ${creator.fullName}, you have received a new response for your form "${publicForm.form.title}" on ${submission.submittedAt.toISOString()}.\n`
        );
      }
    }

    return {
      submissionId: submission.id,
      status: submission.status,
      submittedAt: submission.submittedAt,
      message: "Response captured. Thank you.",
    };
  }

  public async listResponses(input: {
    userId: string;
    formId: string;
    limit?: number;
    offset?: number;
  }) {
    await this.getOwnedForm(input.userId, input.formId);
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const offset = Math.max(input.offset ?? 0, 0);
    const rows = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.formId, input.formId))
      .orderBy(desc(submissionsTable.submittedAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      limit,
      offset,
    };
  }

  public async getSubmissionDetail(input: {
    userId: string;
    formId: string;
    submissionId: string;
  }) {
    await this.getOwnedForm(input.userId, input.formId);
    const [submission] = await db
      .select()
      .from(submissionsTable)
      .where(and(eq(submissionsTable.id, input.submissionId), eq(submissionsTable.formId, input.formId)))
      .limit(1);

    if (!submission) throw new FormsServiceError("Submission not found.", "NOT_FOUND");

    const answers = await db
      .select()
      .from(submissionAnswersTable)
      .where(eq(submissionAnswersTable.submissionId, submission.id));

    return { submission, answers };
  }

  public async analyticsSummary(input: { userId: string; formId: string }) {
    await this.getOwnedForm(input.userId, input.formId);
    const rows = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.formId, input.formId))
      .orderBy(desc(submissionsTable.submittedAt));

    const totalResponses = rows.length;
    const completed = rows.filter((row) => row.status === "COMPLETED").length;
    const avgCompletionTimeMs =
      rows.reduce((sum, row) => sum + (row.durationMs ?? 0), 0) /
      Math.max(rows.filter((row) => row.durationMs !== null).length, 1);

    return {
      totalResponses,
      completed,
      partial: rows.filter((row) => row.status === "PARTIAL").length,
      abandoned: rows.filter((row) => row.status === "ABANDONED").length,
      avgCompletionTimeMs: Math.round(avgCompletionTimeMs),
      completionRate: totalResponses ? Math.round((completed / totalResponses) * 100) : 0,
      recentResponses: rows.slice(0, 5),
    };
  }

  public async timeSeries(input: { userId: string; formId: string; days?: number }) {
    await this.getOwnedForm(input.userId, input.formId);
    const days = Math.min(Math.max(input.days ?? 14, 1), 90);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const rows = await db
      .select()
      .from(submissionsTable)
      .where(and(eq(submissionsTable.formId, input.formId), gte(submissionsTable.submittedAt, start)));

    const buckets = new Map<string, number>();
    for (let index = 0; index < days; index++) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      buckets.set(date.toISOString().slice(0, 10), 0);
    }

    for (const row of rows) {
      const key = row.submittedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([date, responses]) => ({ date, responses }));
  }

  public async fieldBreakdown(input: { userId: string; formId: string }) {
    const form = await this.getOwnedForm(input.userId, input.formId);
    const version = await this.getCurrentVersion(form);
    if (!version) throw new FormsServiceError("Form version not found.", "NOT_FOUND");
    const definition = parseDefinition(version.schemaJson);
    const breakdownFields = definition.fields.filter((field) =>
      ["select", "multi-select", "boolean"].includes(field.kind),
    );

    const answerRows = await db
      .select({
        fieldId: submissionAnswersTable.fieldId,
        valueJson: submissionAnswersTable.valueJson,
      })
      .from(submissionAnswersTable)
      .innerJoin(submissionsTable, eq(submissionAnswersTable.submissionId, submissionsTable.id))
      .where(eq(submissionsTable.formId, input.formId));

    return breakdownFields.map((field) => {
      const counts = new Map<string, number>();
      for (const row of answerRows.filter((answer) => answer.fieldId === field.id)) {
        const values = Array.isArray(row.valueJson) ? row.valueJson : [row.valueJson];
        for (const value of values) {
          const key = String(value);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }

      return {
        fieldId: field.id,
        label: field.label,
        kind: field.kind,
        options: Array.from(counts.entries()).map(([option, count]) => ({ option, count })),
      };
    });
  }

  private async getOwnedForm(userId: string, formId: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.id, formId), eq(formsTable.createdBy, userId)))
      .limit(1);
    if (!form) throw new FormsServiceError("Form not found.", "NOT_FOUND");
    return form;
  }

  private async getCurrentVersion(form: FormRow): Promise<VersionRow | null> {
    if (form.currentVersionId) {
      const [version] = await db
        .select()
        .from(formVersionsTable)
        .where(eq(formVersionsTable.id, form.currentVersionId))
        .limit(1);
      if (version) return version;
    }

    const [latest] = await db
      .select()
      .from(formVersionsTable)
      .where(eq(formVersionsTable.formId, form.id))
      .orderBy(desc(formVersionsTable.version))
      .limit(1);
    return latest ?? null;
  }

  private checkRateLimit(key: string) {
    const result = submissionRateLimiter.hit(key);
    if (!result.allowed) {
      throw new FormsServiceError("Too many submissions. Please try again soon.", "TOO_MANY_REQUESTS");
    }
  }

  private serializeForm(form: FormRow, version: VersionRow, definition: FormDefinition) {
    return {
      ...this.serializeFormMeta(form),
      currentVersion: {
        id: version.id,
        version: version.version,
        schemaJson: definition,
        publishedAt: version.publishedAt,
      },
    };
  }

  private serializeFormMeta(form: FormRow) {
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      status: form.status,
      visibility: form.visibility,
      responseAuthMode: form.responseAuthMode,
      genre: form.genre,
      templateKey: form.templateKey,
      themeVariant: form.themeVariant,
      slug: form.slug,
      shareToken: form.shareToken,
      publicToken: publicTokenFor(form),
      publicUrl: `/f/${publicTokenFor(form)}`,
      createdBy: form.createdBy,
      isPublished: form.isPublished,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}

export default FormsService;
