import { z } from "zod";

export const getAuthenticationMethodOutputSchema = z.object({
  provider: z.enum(["GOOGLE_OAUTH", "CREDENTIALS"]),
  displayName: z.string().optional(),
  displayText: z.string().optional(),
  authUrl: z.string().optional(),
});
export type GetAuthenticationMethodOutputSchema = z.infer<
  typeof getAuthenticationMethodOutputSchema
>;
