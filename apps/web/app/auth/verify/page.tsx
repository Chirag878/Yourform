"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CloudRain, Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "prompt">(
    token ? "loading" : "prompt"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      toast.success("Email verified successfully!");
    },
    onError: (error) => {
      setStatus("error");
      setErrorMsg(error.message);
      toast.error(error.message);
    },
  });

  const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Verification link has been sent! Check your terminal console.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate({ token });
    }
  }, [token]);

  const handleResend = () => {
    resendMutation.mutate(undefined);
  };

  return (
    <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
      <div className="flex justify-center">
        <span className="flex size-12 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100">
          <CloudRain className="size-6 animate-pulse" />
        </span>
      </div>

      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 className="size-10 text-cyan-400 animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-white">Verifying your email</h2>
          <p className="text-sm text-cyan-100/70">
            Please wait while we confirm your email address.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle className="size-12 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-sm text-cyan-100/70">
            Thank you! Your email has been confirmed. You can now access your full creator dashboard.
          </p>
          <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <AlertCircle className="size-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-semibold text-white">Verification Failed</h2>
          <p className="text-sm text-rose-200/80 bg-rose-950/40 border border-rose-900/30 rounded-md p-3">
            {errorMsg || "The verification token is invalid or has expired."}
          </p>
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/10"
            >
              {resendMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="size-4 mr-2" />
              )}
              Resend Verification Link
            </Button>
            <Button asChild variant="ghost" className="w-full text-cyan-400 hover:text-cyan-300">
              <Link href="/auth">Back to Login</Link>
            </Button>
          </div>
        </div>
      )}

      {status === "prompt" && (
        <div className="space-y-4">
          <Mail className="size-12 text-cyan-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-white">Check your email!</h2>
          <p className="text-sm text-cyan-100/70">
            We have dispatched a verification link to your email address. Please click the link to activate your account.
          </p>
          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-md p-3 text-xs text-cyan-300/90 text-left">
            <strong>Developer Note:</strong> Since no external SMTP keys are configured for safety, the link has been printed directly to your backend terminal console!
          </div>
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {resendMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="size-4 mr-2" />
              )}
              Resend Verification Email
            </Button>
            <Button asChild variant="ghost" className="w-full text-cyan-400 hover:text-cyan-300">
              <Link href="/auth">Back to Login</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense
        fallback={
          <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
            <Loader2 className="size-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-cyan-100/70">Loading email verification...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
