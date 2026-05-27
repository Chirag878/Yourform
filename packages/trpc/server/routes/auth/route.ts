import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");



const publicUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.enum(["Creator", "User"]).nullable(),
  emailVerified: z.boolean(),
});

const authOutputSchema = z.object({
  user: publicUserSchema,
  token: z.string(),
});

const toAuthError = (error: unknown): never => {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "Authentication failed.",
  });
};

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  signup: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/signup"),
        tags: TAGS,
        summary: "Create a creator account",
      },
    })
    .input(
      z.object({
        fullName: z.string().min(2).max(80),
        email: z.string().email(),
        password: z.string().min(8).max(120),
      }),
    )
    .output(authOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await userService.signup(input);
      } catch (error) {
        return toAuthError(error);
      }
    }),

  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/login"),
        tags: TAGS,
        summary: "Login with email and password",
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1).max(120),
      }),
    )
    .output(authOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await userService.login(input);
      } catch (error) {
        return toAuthError(error);
      }
    }),

  me: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/me"),
        tags: TAGS,
        summary: "Get the authenticated creator",
        protect: true,
      },
    })
    .input(zodUndefinedModel)
    .output(publicUserSchema)
    .query(({ ctx }) => ctx.user),

  googleCallback: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/google-callback"),
        tags: TAGS,
        summary: "Callback for Google OAuth",
      },
    })
    .input(z.object({ code: z.string() }))
    .output(authOutputSchema)
    .mutation(async ({ input }) => {
      try {
        return await userService.googleCallback(input.code);
      } catch (error) {
        return toAuthError(error);
      }
    }),

  requestPasswordReset: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/request-password-reset"),
        tags: TAGS,
        summary: "Request a password reset link",
      },
    })
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        await userService.requestPasswordReset(input.email);
        return { success: true };
      } catch (error) {
        return toAuthError(error);
      }
    }),

  resetPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/reset-password"),
        tags: TAGS,
        summary: "Reset password using token",
      },
    })
    .input(z.object({ token: z.string(), password: z.string().min(8).max(120) }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        await userService.resetPassword(input.token, input.password);
        return { success: true };
      } catch (error) {
        return toAuthError(error);
      }
    }),

  verifyEmail: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/verify-email"),
        tags: TAGS,
        summary: "Verify email using token",
      },
    })
    .input(z.object({ token: z.string() }))
    .output(publicUserSchema)
    .mutation(async ({ input }) => {
      try {
        return await userService.verifyEmail(input.token);
      } catch (error) {
        return toAuthError(error);
      }
    }),

  resendVerificationEmail: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/resend-verification"),
        tags: TAGS,
        summary: "Resend email verification token",
        protect: true,
      },
    })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      try {
        await userService.resendVerificationEmail(ctx.user.id);
        return { success: true };
      } catch (error) {
        return toAuthError(error);
      }
    }),
});
