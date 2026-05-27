import { z } from "../../schema";
import { formsService } from "../../services";
import { verifiedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  formDefinitionSchema,
  formOutputSchema,
  handleServiceError,
  responseAuthModeSchema,
  themeVariantSchema,
  visibilitySchema,
} from "../shared";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");

export const formsRouter = router({
  createDraft: verifiedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/drafts"), tags: TAGS, protect: true } })
    .input(
      z.object({
        title: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
        visibility: visibilitySchema.default("Unlisted"),
        responseAuthMode: responseAuthModeSchema.default("PUBLIC"),
        themeVariant: themeVariantSchema.default("mist-valley"),
      }),
    )
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await formsService.createDraft({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error);
      }
    }),

  updateDraftSchema: verifiedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/schema"), tags: TAGS, protect: true } })
    .input(
      z.object({
        formId: z.string().uuid(),
        definition: formDefinitionSchema,
        visibility: visibilitySchema.optional(),
        responseAuthMode: responseAuthModeSchema.optional(),
        themeVariant: themeVariantSchema.optional(),
      }),
    )
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await formsService.updateDraftSchema({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error);
      }
    }),

  publish: verifiedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{formId}/publish"), tags: TAGS, protect: true } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await formsService.publish({ userId: ctx.user.id, formId: input.formId });
      } catch (error) {
        return handleServiceError(error);
      }
    }),

  listMine: verifiedProcedure
    .meta({ openapi: { method: "GET", path: getPath(""), tags: TAGS, protect: true } })
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    )
    .output(z.array(formOutputSchema))
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.listMine({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error);
      }
    }),

  getById: verifiedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{formId}"), tags: TAGS, protect: true } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(formOutputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.getById({ userId: ctx.user.id, formId: input.formId });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),
});
