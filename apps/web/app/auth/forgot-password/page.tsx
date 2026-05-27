"use client";

import Link from "next/link";
import { CloudRain, Mail, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { trpc } from "~/trpc/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Password reset request sent!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    requestReset.mutate({ email });
  };

  return (
    <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
      <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 space-y-6">
        <Link href="/auth" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition">
          <ArrowLeft className="size-3" /> Back to Login
        </Link>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <span className="flex size-10 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100">
              <CloudRain className="size-5" />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-cyan-50/70">
            Enter your email and we'll dispatch a secure reset link.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="creator@yourform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10"
                disabled={requestReset.isPending}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={requestReset.isPending}
              className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {requestReset.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Sending Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-950/30 border border-emerald-900/30 text-emerald-400">
              <Mail className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Check Your Inbox</h2>
            <p className="text-sm text-cyan-100/70">
              If an account is associated with <strong>{email}</strong>, a secure password reset link has been dispatched.
            </p>
            <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-md p-3 text-xs text-cyan-300/90 text-left">
              <strong>Developer Note:</strong> Since no external SMTP keys are configured for safety, the link has been printed directly to your backend terminal console!
            </div>
            <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 mt-2">
              <Link href="/auth">Back to Login</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
