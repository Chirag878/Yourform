"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudRain, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { setAuthToken } from "~/lib/auth-token";
import { trpc } from "~/trpc/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("Creator Demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const providersQuery = trpc.auth.getSupportedAuthenticationProviders.useQuery(undefined);
  const googleProvider = providersQuery.data?.find((p) => p.provider === "GOOGLE_OAUTH");

  const onSuccess = (result: { token: string; user: { emailVerified: boolean } }) => {
    setAuthToken(result.token);
    if (!result.user.emailVerified) {
      toast.success("Account created! Please verify your email.");
      router.push("/auth/verify");
    } else {
      toast.success("Welcome to YourForm");
      router.push("/dashboard");
    }
  };

  const login = trpc.auth.login.useMutation({
    onSuccess,
    onError: (error) => toast.error(error.message),
  });
  const signup = trpc.auth.signup.useMutation({
    onSuccess,
    onError: (error) => toast.error(error.message),
  });

  const submit = () => {
    if (mode === "signup") {
      signup.mutate({ fullName, email, password });
      return;
    }
    login.mutate({ email, password });
  };

  const isPending = login.isPending || signup.isPending;

  return (
    <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-lg p-6 sm:p-8">
          <Link href="/" className="mb-8 flex items-center gap-3 text-sm font-semibold text-white">
            <span className="flex size-10 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100">
              <CloudRain className="size-5" />
            </span>
            YourForm
          </Link>

          <div className="mb-6 flex rounded-md border border-white/10 bg-white/[0.06] p-1">
            {(["signup", "login"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex-1 rounded-sm px-4 py-2 text-sm font-medium transition ${
                  mode === item ? "bg-cyan-200 text-slate-950" : "text-cyan-50/70 hover:bg-white/10"
                }`}
              >
                {item === "signup" ? "Signup" : "Login"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {googleProvider?.authUrl ? (
              <>
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-white/20 bg-white/5 hover:bg-white/10 hover:text-white"
                >
                  <Link href={googleProvider.authUrl} className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Continue with Google
                  </Link>
                </Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#232D3F] px-2 text-cyan-50/50">Or continue with</span>
                  </div>
                </div>
              </>
            ) : null}

            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} className="bg-white/10" />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" ? (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                ) : null}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-white/10"
              />
            </div>
            <Button onClick={submit} disabled={isPending} className="w-full bg-pink-200 text-slate-950 hover:bg-pink-100">
              {mode === "signup" ? <UserPlus /> : <LogIn />}
              {isPending ? "Please wait" : mode === "signup" ? "Create account" : "Login"}
            </Button>
          </div>
        </div>

        <div className="glass-panel hidden rounded-lg p-8 lg:block">
          <div className="success-spark flex h-full min-h-[520px] flex-col justify-end rounded-lg border border-white/10 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">Premium Creator Cockpit</p>
            <h1 className="mt-4 max-w-md text-5xl font-bold leading-tight text-white">
              Build cinematically, validate strictly, collect securely.
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
}
