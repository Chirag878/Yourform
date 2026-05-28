import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@repo/database/client";
import { usersTable } from "@repo/database/schema";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import { GetAuthenticationMethodOutputSchema } from "./model";
import { EmailService } from "../email";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: "Creator" | "User" | null;
  emailVerified: boolean;
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
  emailVerified: !!user.emailVerified,
});

const hashForResetToken = (passwordHash: string) => {
  return createHash("md5").update(passwordHash || "").digest("hex");
};

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
      const url = googleOAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        prompt: "select_account",
      });
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

  public createVerificationToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: "email-verification",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${signPayload(encoded)}`;
  }

  public verifyVerificationToken(token: string): { sub: string; email: string } {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature || signPayload(encoded) !== signature) {
      throw new Error("Invalid verification signature");
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.type !== "email-verification") {
      throw new Error("Invalid token type");
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Verification token has expired");
    }
    return { sub: payload.sub, email: payload.email };
  }

  public async verifyEmail(token: string): Promise<PublicUser> {
    const { sub } = this.verifyVerificationToken(token);
    const [user] = await db
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.id, sub))
      .returning();
    if (!user) {
      throw new Error("User not found");
    }
    return toPublicUser(user);
  }

  public async resendVerificationEmail(userId: string): Promise<void> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }
    const verificationToken = this.createVerificationToken(user.id, user.email);
    const verificationLink = `${env.APP_URL ?? "http://localhost:8080"}/auth/verify?token=${verificationToken}`;
    await EmailService.sendMail({
      to: user.email,
      subject: "Verify Your YourForm Account",
      html: EmailService.getVerifyEmailTemplate(user.fullName, verificationLink),
    });
  }

  public async requestPasswordReset(emailInput: string): Promise<void> {
    const email = emailInput.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      console.log(`[MAILER FALLBACK] Password reset requested for non-existent email: ${email}`);
      return;
    }
    const passHashSig = hashForResetToken(user.passwordHash || "");
    const payload = {
      sub: user.id,
      email: user.email,
      passHash: passHashSig,
      type: "password-reset",
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const token = `${encoded}.${signPayload(encoded)}`;
    const resetLink = `${env.APP_URL ?? "http://localhost:8080"}/auth/reset-password?token=${token}`;
    await EmailService.sendMail({
      to: user.email,
      subject: "Reset Your YourForm Password",
      html: EmailService.getResetPasswordTemplate(user.fullName, resetLink),
    });
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature || signPayload(encoded) !== signature) {
      throw new Error("Invalid reset signature");
    }
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.type !== "password-reset") {
      throw new Error("Invalid token type");
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Reset token has expired");
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);
    if (!user) {
      throw new Error("User not found");
    }

    const passHashSig = hashForResetToken(user.passwordHash || "");
    if (payload.passHash !== passHashSig) {
      throw new Error("This reset token has already been used or is invalid");
    }

    const newPasswordHash = hashPassword(newPassword);
    await db
      .update(usersTable)
      .set({ passwordHash: newPasswordHash, emailVerified: true })
      .where(eq(usersTable.id, user.id));
  }

  public async googleCallback(code: string): Promise<{ user: PublicUser; token: string }> {
    if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
      throw new Error("Google OAuth is not configured on this server.");
    }

    const { tokens } = await googleOAuth2Client.getToken(code);
    if (!tokens.id_token) {
      throw new Error("No ID token returned by Google.");
    }

    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid profile payload from Google.");
    }

    const email = payload.email.trim().toLowerCase();
    const fullName = payload.name || payload.given_name || "Google User";
    const profileImageUrl = payload.picture || null;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (user) {
      if (!user.emailVerified || user.provider !== "GOOGLE_OAUTH") {
        const [updatedUser] = await db
          .update(usersTable)
          .set({
            emailVerified: true,
            provider: user.provider === "credentials" ? "credentials" : "GOOGLE_OAUTH",
            profileImageUrl: user.profileImageUrl || profileImageUrl,
          })
          .where(eq(usersTable.id, user.id))
          .returning();
        if (updatedUser) {
          user = updatedUser;
        }
      }
    } else {
      const [newUser] = await db
        .insert(usersTable)
        .values({
          fullName,
          email,
          emailVerified: true,
          provider: "GOOGLE_OAUTH",
          role: "Creator",
          profileImageUrl,
        })
        .returning();
      if (!newUser) {
        throw new Error("Unable to register user via Google.");
      }
      user = newUser;
    }

    return {
      user: toPublicUser(user),
      token: this.createSessionToken(user),
    };
  }
}

export default UserService;
