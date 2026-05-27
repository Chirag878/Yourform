import { z } from "zod";

export const createDraftFormInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["public", "unlisted"]).optional().default("unlisted"),
  responseAuthMode: z.enum(["public", "authenticated"]).optional().default("public"),
  themeVariant: z.enum(["feedback", "jobs", "event", "survey"]).optional(),
});