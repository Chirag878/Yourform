"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CloudRain, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { setAuthToken } from "~/lib/auth-token";
import { trpc } from "~/trpc/client";

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [errorMsg, setErrorMsg] = useState("");

  const googleCallbackMutation = trpc.auth.googleCallback.useMutation({
    onSuccess: (result) => {
      setAuthToken(result.token);
      toast.success("Successfully logged in with Google!");
      router.push("/dashboard");
    },
    onError: (error) => {
      setErrorMsg(error.message);
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (code) {
      googleCallbackMutation.mutate({ code });
    } else {
      setErrorMsg("Authorization code is missing from Google redirect.");
    }
  }, [code]);

  return (
    <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
      <div className="flex justify-center">
        <span className="flex size-12 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100">
          <CloudRain className="size-6 animate-pulse" />
        </span>
      </div>

      {!errorMsg ? (
        <div className="space-y-4">
          <Loader2 className="size-10 text-cyan-400 animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-white">Authenticating with Google</h2>
          <p className="text-sm text-cyan-100/70">
            Securely connecting you to your creator cockpit...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AlertCircle className="size-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-semibold text-white">Authentication Failed</h2>
          <p className="text-sm text-rose-200/80 bg-rose-950/40 border border-rose-900/30 rounded-md p-3">
            {errorMsg}
          </p>
          <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 mt-4">
            <Link href="/auth">Back to Login</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense
        fallback={
          <div className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8 text-center space-y-6">
            <Loader2 className="size-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-cyan-100/70">Connecting to Google Auth...</p>
          </div>
        }
      >
        <CallbackContentWrapper />
      </Suspense>
    </main>
  );
}

function CallbackContentWrapper() {
  return <GoogleCallbackContent />;
}
