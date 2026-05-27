import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "YourForm Monsoon Aurora API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
  description:
    "Creator auth, form builder, publishing, public submissions, responses, analytics, and template catalog endpoints. Protected endpoints require an Authorization: Bearer session token from /authentication/login or /authentication/signup.",
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}

app.use(express.json({ limit: "220kb" }));

app.get("/", (req, res) => {
  return res.json({ message: "YourForm API is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "YourForm server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
