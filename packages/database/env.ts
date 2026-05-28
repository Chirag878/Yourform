import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgres://dummy:dummy@localhost:5432/dummy"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
