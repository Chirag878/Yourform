import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { analyticsRouter } from "./routes/analytics/route";
import { formsRouter } from "./routes/forms/route";
import { publicFormsRouter } from "./routes/public-forms/route";
import { responsesRouter } from "./routes/responses/route";
import { templatesRouter } from "./routes/templates/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  forms: formsRouter,
  publicForms: publicFormsRouter,
  responses: responsesRouter,
  analytics: analyticsRouter,
  templates: templatesRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
