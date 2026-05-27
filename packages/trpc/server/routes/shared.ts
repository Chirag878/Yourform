import { TRPCError } from "@trpc/server";
import { formDefinitionSchema, themeVariantSchema } from "@repo/database/form-definition";
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

export const handleServiceError = (
  error: unknown,
  code: "BAD_REQUEST" | "NOT_FOUND" | "UNAUTHORIZED" = "BAD_REQUEST",
): never => {
  throw new TRPCError({
    code,
    message: error instanceof Error ? error.message : "Request failed.",
  });
};
