"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, Clock, Eye, FileText, HelpCircle, Layers, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { trpc } from "~/trpc/client";

type SubmissionRow = {
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

const formatDuration = (ms: number | null) => {
  if (ms === null || ms === undefined) return "-";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

export default function ResponsesListPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const [limit] = useState(50);
  const [offset] = useState(0);

  const form = trpc.forms.getById.useQuery({ formId }, { retry: false });
  const responsesQuery = trpc.responses.listByForm.useQuery(
    { formId, limit, offset },
    { retry: false }
  );

  const theme = (form.data?.themeVariant as string | undefined) ?? "mist-valley";
  const responseData = responsesQuery.data as { items?: SubmissionRow[]; limit: number; offset: number } | undefined;
  const submissions = responseData?.items ?? [];

  const getStatusBadge = (status: SubmissionRow["status"]) => {
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

  if (form.error) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel rounded-lg p-8 text-center">
          <p className="text-white font-medium">{form.error.message}</p>
          <Button asChild className="mt-5 bg-cyan-200 text-slate-950 hover:bg-cyan-100">
            <Link href="/auth">Login</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={`aurora-shell theme-${theme} min-h-screen px-5 py-6 sm:px-8 lg:px-10`}>
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white">
            <Link href="/dashboard">
              <ArrowLeft className="size-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-cyan-100 hover:bg-white/10">
              <Link href={`/forms/${formId}/analytics`}>
                <BarChart3 className="size-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-cyan-100 hover:bg-white/10">
              <Link href={`/builder/${formId}`}>
                <Layers className="size-4 mr-2" />
                Open Builder
              </Link>
            </Button>
          </div>
        </nav>

        <header className="glass-panel mt-6 rounded-lg p-6 sm:p-8">
          <p className="text-sm uppercase tracking-wider text-pink-200">Response Viewer</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{form.data?.title ?? "Submissions"}</h1>
          <p className="mt-2 text-cyan-50/68">{form.data?.description ?? "Review individual submissions below."}</p>
        </header>

        <section className="mt-8">
          <div className="glass-panel overflow-hidden rounded-lg">
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                <FileText className="size-5 text-cyan-100" />
                <span>All Responses ({submissions.length})</span>
              </div>
              <span className="text-xs text-cyan-100/50">Showing last {limit} items</span>
            </div>

            {responsesQuery.isLoading ? (
              <div className="p-12 text-center text-cyan-100/60">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="size-8 rounded-full border-2 border-t-transparent border-cyan-100 animate-spin" />
                  <span>Loading submissions...</span>
                </div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-16 text-center text-cyan-100/60">
                <HelpCircle className="mx-auto size-12 text-cyan-100/20" />
                <h3 className="mt-4 text-lg font-semibold text-white">No responses yet</h3>
                <p className="mt-2 text-sm text-cyan-100/50 max-w-sm mx-auto">
                  Once users open your link and complete the form, their answers will display right here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-cyan-100/70 pl-6">Submission ID</TableHead>
                    <TableHead className="text-cyan-100/70">Status</TableHead>
                    <TableHead className="text-cyan-100/70">Time Taken</TableHead>
                    <TableHead className="text-cyan-100/70">Started At</TableHead>
                    <TableHead className="text-cyan-100/70">Submitted At</TableHead>
                    <TableHead className="text-cyan-100/70 text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((row) => (
                    <TableRow key={row.id} className="border-white/10 hover:bg-white/[0.04]">
                      <TableCell className="font-mono text-xs text-cyan-100/80 pl-6 max-w-[120px] truncate">
                        {row.id}
                      </TableCell>
                      <TableCell>{getStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-white">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Clock className="size-3.5 text-cyan-100/50" />
                          {formatDuration(row.durationMs)}
                        </span>
                      </TableCell>
                      <TableCell className="text-cyan-100/60 text-sm">
                        {row.startedAt ? new Date(row.startedAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-cyan-100/80 text-sm">
                        {new Date(row.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button asChild size="sm" className="bg-cyan-200 text-slate-950 hover:bg-cyan-100 font-medium">
                          <Link href={`/forms/${formId}/responses/${row.id}`}>
                            <Eye className="size-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        <footer className="mt-8 pb-10 flex items-center justify-between text-xs text-cyan-50/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-cyan-100/30" />
            <span>Responses are safely encrypted and hashed on database transaction.</span>
          </div>
          <span>YourForm cockpit</span>
        </footer>
      </div>
    </main>
  );
}
