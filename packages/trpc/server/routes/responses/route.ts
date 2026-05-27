import { z } from "../../schema";
import { formsService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { handleServiceError } from "../shared";

const TAGS = ["Responses"];
const getPath = generatePath("/responses");

export const responsesRouter = router({
  listByForm: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms/{formId}"), tags: TAGS, protect: true } })
    .input(
      z.object({
        formId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    )
    .output(z.unknown())
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.listResponses({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),

  getSubmissionDetail: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms/{formId}/{submissionId}"), tags: TAGS, protect: true } })
    .input(
      z.object({
        formId: z.string().uuid(),
        submissionId: z.string().uuid(),
      }),
    )
    .output(z.unknown())
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.getSubmissionDetail({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),
});
