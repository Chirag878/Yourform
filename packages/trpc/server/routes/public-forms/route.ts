import { z } from "../../schema";
import { formsService } from "../../services";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { handleServiceError, publicFormFetchOutputSchema } from "../shared";

const TAGS = ["Public Forms"];
const getPath = generatePath("/public-forms");

export const publicFormsRouter = router({
  getByToken: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/{token}"),
        tags: TAGS,
        summary: "Fetch a published form by public or unlisted token",
      },
    })
    .input(z.object({ token: z.string().min(4) }))
    .output(publicFormFetchOutputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await formsService.getPublicByToken({ token: input.token, userId: ctx.user?.id });
      } catch (error) {
        return handleServiceError(error, "NOT_FOUND");
      }
    }),

  submit: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/{token}/submissions"),
        tags: TAGS,
        summary: "Submit a response for a published form",
      },
    })
    .input(
      z.object({
        token: z.string().min(4),
        answers: z.record(z.string(), z.unknown()),
        durationMs: z.number().int().min(0).optional(),
        startedAt: z.string().optional(),
        honeypot: z.string().optional(),
      }),
    )
    .output(
      z.object({
        submissionId: z.string().uuid(),
        status: z.string(),
        submittedAt: z.date(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await formsService.submit({
          ...input,
          userId: ctx.user?.id,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      } catch (error) {
        return handleServiceError(error);
      }
    }),
});
