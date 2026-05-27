"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Compass, FileCheck2, ShieldCheck, Terminal, User } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { FormDefinition, FormField } from "~/lib/forms";
import { trpc } from "~/trpc/client";

type SubmissionDetailPayload = {
  submission: {
    id: string;
    formId: string;
    versionId: string;
    respondentId: string | null;
    status: "In_PROGRESS" | "COMPLETED" | "PARTIAL" | "ABANDONED";
    durationMs: number | null;
    ipHash: string | null;
    unHash: string | null;
    startedAt: string | null;
    submittedAt: string;
  };
  answers: Array<{
    id: string;
    submissionId: string;
    fieldId: string;
    valueJson: unknown;
    valueText: string | null;
    isValid: boolean;
  }>;
};

const formatDuration = (ms: number | null) => {
  if (ms === null || ms === undefined) return "-";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const getSchemaJson = (currentVersion: unknown) =>
  (currentVersion as { schemaJson?: FormDefinition } | undefined)?.schemaJson;

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string; submissionId: string }>();
  const formId = params.id;
  const submissionId = params.submissionId;

  const form = trpc.forms.getById.useQuery({ formId }, { retry: false });
  const detailQuery = trpc.responses.getSubmissionDetail.useQuery(
    { formId, submissionId },
    { retry: false }
  );

  const theme = (form.data?.themeVariant as string | undefined) ?? "mist-valley";
  const payload = detailQuery.data as SubmissionDetailPayload | undefined;
  const definition = getSchemaJson(form.data?.currentVersion);
  const fields = definition?.fields ?? [];
  const answers = payload?.answers ?? [];

  const getStatusBadge = (status?: SubmissionDetailPayload["submission"]["status"]) => {
    if (!status) return null;
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-medium hover:bg-emerald-500/20">
            Completed
          </Badge>
        );
      case "In_PROGRESS":
        return (
          <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/20 font-medium hover:bg-sky-500/20">
            In Progress
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 font-medium hover:bg-amber-500/20">
            Partial
          </Badge>
        );
      case "ABANDONED":
        return (
          <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20 font-medium hover:bg-rose-500/20">
            Abandoned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderAnswerValue = (field: FormField, value: unknown) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-cyan-100/30 italic">No answer provided</span>;
    }

    if (field.kind === "boolean") {
      return (
        <span className="font-semibold text-white">
          {value ? "Yes" : "No"}
        </span>
      );
    }

    if (field.kind === "multi-select" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((opt) => (
            <Badge key={String(opt)} className="bg-cyan-200/10 text-cyan-100 border-cyan-200/20 hover:bg-cyan-200/20">
              {String(opt)}
            </Badge>
          ))}
        </div>
      );
    }

    if (field.kind === "long-text") {
      return (
        <div className="rounded-md border border-white/5 bg-slate-950/20 p-4 text-cyan-100/90 whitespace-pre-wrap leading-relaxed text-sm">
          {String(value)}
        </div>
      );
    }

    return <span className="font-medium text-white text-lg">{String(value)}</span>;
  };

  if (form.error || detailQuery.error) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel rounded-lg p-8 text-center">
          <p className="text-white font-medium">{form.error?.message ?? detailQuery.error?.message}</p>
          <Button asChild className="mt-5 bg-cyan-200 text-slate-950 hover:bg-cyan-100">
            <Link href="/auth">Login</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={`aurora-shell theme-${theme} min-h-screen px-5 py-6 sm:px-8 lg:px-10`}>
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center">
          <Button asChild variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white">
            <Link href={`/forms/${formId}/responses`}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Responses
            </Link>
          </Button>
        </nav>

        <header className="glass-panel mt-6 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wider text-cyan-200">Response Detail</p>
            <h1 className="mt-2 text-3xl font-bold text-white">{form.data?.title ?? "Submission details"}</h1>
            <p className="mt-1 text-sm font-mono text-cyan-50/50 truncate max-w-md">ID: {submissionId}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {getStatusBadge(payload?.submission.status)}
            <Badge variant="outline" className="border-white/10 bg-white/5 text-cyan-100">
              Version {form.data?.currentVersion ? (form.data.currentVersion as { version: number }).version : 1}
            </Badge>
          </div>
        </header>

        {detailQuery.isLoading ? (
          <div className="mt-8 p-12 text-center text-cyan-100/60 glass-panel rounded-lg">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-t-transparent border-cyan-100 animate-spin" />
              <span>Loading response details...</span>
            </div>
          </div>
        ) : !payload ? (
          <div className="mt-8 p-12 text-center text-cyan-100/60 glass-panel rounded-lg">
            Submission details not found.
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            {/* Metadata Card */}
            <section className="glass-panel rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Submission Metadata
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
                <div className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 text-cyan-50/55">
                    <Clock className="size-4" />
                    <span>Duration</span>
                  </div>
                  <p className="mt-1.5 font-semibold text-white">
                    {formatDuration(payload.submission.durationMs)}
                  </p>
                </div>

                <div className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 text-cyan-50/55">
                    <Calendar className="size-4" />
                    <span>Submitted At</span>
                  </div>
                  <p className="mt-1.5 font-semibold text-white">
                    {new Date(payload.submission.submittedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-cyan-50/40">
                    {new Date(payload.submission.submittedAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 text-cyan-50/55">
                    <Terminal className="size-4" />
                    <span>IP Hash</span>
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-cyan-100 truncate" title={payload.submission.ipHash ?? "unknown"}>
                    {payload.submission.ipHash ? payload.submission.ipHash.slice(0, 10) + "..." : "unknown"}
                  </p>
                </div>

                <div className="rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 text-cyan-50/55">
                    <Compass className="size-4" />
                    <span>User Agent Hash</span>
                  </div>
                  <p className="mt-1.5 font-mono text-xs text-cyan-100 truncate" title={payload.submission.unHash ?? "unknown"}>
                    {payload.submission.unHash ? payload.submission.unHash.slice(0, 10) + "..." : "unknown"}
                  </p>
                </div>
              </div>
            </section>

            {/* Questions and Answers */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-2 text-white font-semibold text-lg">
                <FileCheck2 className="size-5 text-cyan-100" />
                <h2>Responses ({fields.length} questions)</h2>
              </div>

              {fields.map((field, index) => {
                const answer = answers.find((ans) => ans.fieldId === field.id);
                return (
                  <div key={field.id} className="aurora-card rounded-lg p-5 sm:p-6 transition hover:translate-y-0">
                    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="text-xs uppercase tracking-widest text-pink-300 font-semibold">
                          Question {index + 1}
                        </span>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          {field.label}
                        </h3>
                        {field.description ? (
                          <p className="mt-1 text-xs text-cyan-50/55">
                            {field.description}
                          </p>
                        ) : null}
                      </div>
                      <Badge className="bg-white/10 text-cyan-100/70 border-white/5 hover:bg-white/15 uppercase text-[10px] tracking-wider px-2 py-0.5">
                        {field.kind}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      {renderAnswerValue(field, answer?.valueJson)}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        <footer className="mt-8 pb-10 flex items-center justify-between text-xs text-cyan-50/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-cyan-100/30" />
            <span>Answers validated and stored cleanly within PostgreSQL.</span>
          </div>
          <span>YourForm cockpit</span>
        </footer>
      </div>
    </main>
  );
}
