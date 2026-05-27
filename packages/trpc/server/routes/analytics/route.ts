import { z } from "../../schema";
import { formsService } from "../../services";
import { verifiedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { analyticsFieldBreakdownOutputSchema, analyticsSummaryOutputSchema, handleServiceError } from "../shared";

const TAGS = ["Analytics"];
const getPath = generatePath("/analytics");

export const analyticsRouter = router({
  summary: verifiedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/forms/{formId}/summary"),
        tags: TAGS,
        protect: true,
        summary: "Get aggregate analytics for a form",
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(analyticsSummaryOutputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.analyticsSummary({ userId: ctx.user.id, formId: input.formId });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),

  timeSeries: verifiedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/forms/{formId}/time-series"), tags: TAGS, protect: true } })
    .input(z.object({ formId: z.string().uuid(), days: z.number().int().min(1).max(90).optional() }))
    .output(z.array(z.object({ date: z.string(), responses: z.number() })))
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.timeSeries({ userId: ctx.user.id, ...input });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),

  fieldBreakdown: verifiedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/forms/{formId}/field-breakdown"),
        tags: TAGS,
        protect: true,
        summary: "Get per-field option distributions",
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(analyticsFieldBreakdownOutputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.fieldBreakdown({ userId: ctx.user.id, formId: input.formId });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),
});
