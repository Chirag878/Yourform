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

  const onSuccess = (result: { token: string }) => {
    setAuthToken(result.token);
    toast.success("Welcome to YourForm");
    router.push("/dashboard");
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
              <Label htmlFor="password">Password</Label>
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
