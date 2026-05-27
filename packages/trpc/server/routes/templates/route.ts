import { zodUndefinedModel, z } from "../../schema";
import { formsService } from "../../services";
import { verifiedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { formOutputSchema, handleServiceError, responseAuthModeSchema, visibilitySchema } from "../shared";

const TAGS = ["Templates"];
const getPath = generatePath("/templates");

const templateOutputSchema = z
  .object({
    key: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    genre: z.string(),
    themeVariant: z.string(),
    fieldsCount: z.number(),
    defaultFields: z.array(z.unknown()),
  })
  .passthrough();

export const templatesRouter = router({
  listTemplates: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath(""), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(templateOutputSchema))
    .query(() => formsService.listTemplates()),

  createFromTemplate: verifiedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{templateKey}/forms"), tags: TAGS, protect: true } })
    .input(
      z.object({
        templateKey: z.string().min(2),
        visibility: visibilitySchema.default("Unlisted"),
        responseAuthMode: responseAuthModeSchema.default("PUBLIC"),
      }),
    )
    .output(formOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await formsService.createFromTemplate({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error);
      }
    }),
});
