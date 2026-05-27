import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@repo/database/client";
import { usersTable } from "@repo/database/schema";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import { GetAuthenticationMethodOutputSchema } from "./model";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: "Creator" | "User" | null;
};

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

const sessionSecret = () => env.SESSION_SECRET ?? "yourform-demo-session-secret";

const toPublicUser = (user: typeof usersTable.$inferSelect): PublicUser => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored?: string | null) => {
  if (!stored) return false;
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const actual = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return actual.length === candidate.length && timingSafeEqual(actual, candidate);
};

const signPayload = (payload: string) =>
  createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [
      {
        provider: "CREDENTIALS",
        displayName: "Email",
        displayText: "Continue with email and password",
      },
    ];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  public async signup(input: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.trim().toLowerCase();
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing[0]) {
      throw new Error("An account already exists for this email.");
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName: input.fullName.trim(),
        email,
        emailVerified: true,
        passwordHash: hashPassword(input.password),
        role: "Creator",
      })
      .returning();

    if (!user) throw new Error("Unable to create account.");
    return { user: toPublicUser(user), token: this.createSessionToken(user) };
  }

  public async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: PublicUser; token: string }> {
    const email = input.email.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Invalid email or password.");
    }

    return { user: toPublicUser(user), token: this.createSessionToken(user) };
  }

  public createSessionToken(user: typeof usersTable.$inferSelect): string {
    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${signPayload(encoded)}`;
  }

  public async verifySessionToken(token?: string | null): Promise<PublicUser | null> {
    if (!token) return null;
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature || signPayload(encoded) !== signature) return null;

    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
      return user ? toPublicUser(user) : null;
    } catch {
      return null;
    }
  }
}

export default UserService;
