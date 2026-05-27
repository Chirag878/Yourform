import { userService } from "./services";

type HeaderBag = Record<string, string | string[] | undefined>;

type RequestLike = {
  headers?: HeaderBag;
  ip?: string;
  socket?: { remoteAddress?: string };
};

type ResponseLike = unknown;

export type CreateContextOptions = {
  req?: RequestLike;
  res?: ResponseLike;
};

const getHeader = (headers: HeaderBag | undefined, key: string) => {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const getBearerToken = (headers?: HeaderBag) => {
  const authorization = getHeader(headers, "authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length);
  return getHeader(headers, "x-yourform-token");
};

const getIp = (req?: RequestLike) => {
  const forwardedFor = getHeader(req?.headers, "x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? req?.ip ?? req?.socket?.remoteAddress ?? "unknown";
};

export async function createContext(opts: CreateContextOptions = {}) {
  const token = getBearerToken(opts.req?.headers);
  const user = await userService.verifySessionToken(token);

  return {
    user,
    token,
    ip: getIp(opts.req),
    userAgent: getHeader(opts.req?.headers, "user-agent") ?? "unknown",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
