"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CloudRain, KeyRound, Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { trpc } from "~/trpc/client";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset token.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    resetPasswordMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
        <AlertCircle className="size-12 text-rose-500 mx-auto" />
        <h1 className="text-2xl font-bold text-white">Invalid Reset Token</h1>
        <p className="text-sm text-cyan-100/70">
          This password reset link is invalid, corrupt, or has already expired. Please request a new password reset link.
        </p>
        <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          <Link href="/auth/forgot-password">Request Reset Link</Link>
        </Button>
      </div>
    );
  }

  return (
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
        <h1 className="text-2xl font-bold text-white">Choose New Password</h1>
        <p className="text-sm text-cyan-50/70">
          Set a secure new password for your YourForm creator account.
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10"
              disabled={resetPasswordMutation.isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/10"
              disabled={resetPasswordMutation.isPending}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 pt-2"
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-950/30 border border-emerald-900/30 text-emerald-400">
            <CheckCircle className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-white">Password Updated!</h2>
          <p className="text-sm text-cyan-100/70">
            Your password was changed successfully. Redirecting you to the login screen...
          </p>
          <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link href="/auth">Login Now</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense
        fallback={
          <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
            <Loader2 className="size-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-cyan-100/70">Loading password reset...</p>
          </div>
        }
      >
        <VerifyEmailContentWrapper />
      </Suspense>
    </main>
  );
}

function VerifyEmailContentWrapper() {
  return <ResetPasswordContent />;
}
