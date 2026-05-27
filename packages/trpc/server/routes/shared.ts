import { TRPCError } from "@trpc/server";
import { formDefinitionSchema, themeVariantSchema } from "@repo/database/form-definition";
import { FormsServiceError } from "@repo/services/forms/errors";
import { z } from "../schema";

export { formDefinitionSchema, themeVariantSchema };

export const visibilitySchema = z.enum(["Public", "Unlisted", "Private"]);
export const responseAuthModeSchema = z.enum(["PUBLIC", "AUTHENTICATED"]);

export const formOutputSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    visibility: visibilitySchema,
    responseAuthMode: responseAuthModeSchema,
    genre: z.string(),
    templateKey: z.string().nullable(),
    themeVariant: z.string(),
    slug: z.string(),
    shareToken: z.string(),
    publicToken: z.string(),
    publicUrl: z.string(),
    isPublished: z.boolean(),
    currentVersion: z.unknown().optional(),
    responseCount: z.number().optional(),
  })
  .passthrough();

export const publicFormFetchOutputSchema = z
  .object({
    form: formOutputSchema,
    versionId: z.string().uuid().optional(),
    definition: formDefinitionSchema.nullable(),
    requiresAuth: z.boolean(),
  })
  .passthrough();

export const responsesListOutputSchema = z.object({
  items: z.array(z.unknown()),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const submissionDetailOutputSchema = z.object({
  submission: z.unknown(),
  answers: z.array(z.unknown()),
});

export const analyticsSummaryOutputSchema = z.object({
  totalResponses: z.number().int(),
  completed: z.number().int(),
  partial: z.number().int(),
  abandoned: z.number().int(),
  avgCompletionTimeMs: z.number().int(),
  completionRate: z.number().int(),
  recentResponses: z.array(z.unknown()),
});

export const analyticsFieldBreakdownOutputSchema = z.array(
  z.object({
    fieldId: z.string(),
    label: z.string(),
    kind: z.string(),
    options: z.array(
      z.object({
        option: z.string(),
        count: z.number().int(),
      }),
    ),
  }),
);

export const handleServiceError = (
  error: unknown,
  code: "BAD_REQUEST" | "NOT_FOUND" | "UNAUTHORIZED" = "BAD_REQUEST",
): never => {
  if (error instanceof FormsServiceError) {
    const trpcCode =
      error.code === "FORBIDDEN"
        ? "FORBIDDEN"
        : error.code === "TOO_MANY_REQUESTS"
          ? "TOO_MANY_REQUESTS"
          : error.code === "PAYLOAD_TOO_LARGE"
            ? "PAYLOAD_TOO_LARGE"
            : error.code;
    throw new TRPCError({
      code: trpcCode,
      message: error.message,
    });
  }

  throw new TRPCError({
    code,
    message: error instanceof Error ? error.message : "Request failed.",
  });
};
