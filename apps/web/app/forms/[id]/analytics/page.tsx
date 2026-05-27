"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, ListChecks, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import type { LucideIcon } from "lucide-react";

type Summary = {
  totalResponses: number;
  completed: number;
  partial: number;
  abandoned: number;
  avgCompletionTimeMs: number;
  completionRate: number;
  recentResponses: Array<{ id: string; submittedAt: string; status: string; durationMs: number | null }>;
};

type Breakdown = Array<{
  fieldId: string;
  label: string;
  kind: string;
  options: Array<{ option: string; count: number }>;
}>;

const chartColors = ["#7df9ff", "#ff8acb", "#72e6c0", "#ffb45f", "#b774ff", "#8bb7ff"];

const formatDuration = (ms: number) => {
  if (!ms) return "0s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const form = trpc.forms.getById.useQuery({ formId }, { retry: false });
  const summary = trpc.analytics.summary.useQuery({ formId }, { retry: false });
  const timeSeries = trpc.analytics.timeSeries.useQuery({ formId, days: 14 }, { retry: false });
  const breakdown = trpc.analytics.fieldBreakdown.useQuery({ formId }, { retry: false });
  const responses = trpc.responses.listByForm.useQuery({ formId, limit: 8, offset: 0 }, { retry: false });

  const summaryData = summary.data as Summary | undefined;
  const breakdownData = (breakdown.data as Breakdown | undefined) ?? [];
  const firstBreakdown = breakdownData.find((item) => item.options.length > 0);
  const responseItems = ((responses.data as { items?: Summary["recentResponses"] } | undefined)?.items ?? []) as Summary["recentResponses"];
  const theme = (form.data?.themeVariant as string | undefined) ?? "mist-valley";
  const statCards: Array<[string, string | number, LucideIcon]> = [
    ["Responses", summaryData?.totalResponses ?? 0, Users],
    ["Completion", `${summaryData?.completionRate ?? 0}%`, ListChecks],
    ["Avg time", formatDuration(summaryData?.avgCompletionTimeMs ?? 0), Clock],
    ["Completed", summaryData?.completed ?? 0, TrendingUp],
  ];

  if (form.error) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel rounded-lg p-8 text-center">
          <p className="text-white">{form.error.message}</p>
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
              <ArrowLeft />
              Dashboard
            </Link>
          </Button>
          {form.data ? (
            <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <Link href={`/builder/${formId}`}>Open builder</Link>
            </Button>
          ) : null}
        </nav>

        <header className="glass-panel mt-6 rounded-lg p-6 sm:p-8">
          <p className="text-sm text-cyan-100/70">Analytics</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{form.data?.title ?? "Form analytics"}</h1>
          <p className="mt-3 text-cyan-50/68">{form.data?.description}</p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([label, value, Icon]) => (
            <div key={String(label)} className="aurora-card rounded-lg p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-cyan-50/60">{String(label)}</p>
                <Icon className="size-5 text-cyan-100" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-semibold text-white">Responses per day</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries.data ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(230,255,255,0.65)" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} stroke="rgba(230,255,255,0.65)" tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ background: "#0b162d", border: "1px solid rgba(255,255,255,0.15)", color: "white" }} />
                  <Line type="monotone" dataKey="responses" stroke="#7df9ff" strokeWidth={3} dot={{ fill: "#ff8acb" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-semibold text-white">Option distribution</h2>
            <div className="mt-4 h-72">
              {firstBreakdown ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={firstBreakdown.options} dataKey="count" nameKey="option" innerRadius={62} outerRadius={100} paddingAngle={3}>
                      {firstBreakdown.options.map((entry, index) => (
                        <Cell key={entry.option} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ background: "#0b162d", border: "1px solid rgba(255,255,255,0.15)", color: "white" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-cyan-50/62">No option responses yet</div>
              )}
            </div>
            {firstBreakdown ? <p className="text-center text-sm text-cyan-50/62">{firstBreakdown.label}</p> : null}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-semibold text-white">Field breakdown</h2>
            <div className="mt-4 grid gap-4">
              {breakdownData.map((field) => (
                <div key={field.fieldId} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                  <p className="font-medium text-white">{field.label}</p>
                  <div className="mt-3 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={field.options}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="option" stroke="rgba(230,255,255,0.6)" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} stroke="rgba(230,255,255,0.6)" tick={{ fontSize: 11 }} />
                        <RechartsTooltip contentStyle={{ background: "#0b162d", border: "1px solid rgba(255,255,255,0.15)", color: "white" }} />
                        <Bar dataKey="count" fill="#72e6c0" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-semibold text-white">Recent responses</h2>
            <div className="mt-4 grid gap-3">
              {responseItems.map((response) => (
                <div key={response.id} className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.06] p-4">
                  <div>
                    <p className="font-medium text-white">{response.status}</p>
                    <p className="text-sm text-cyan-50/60">{new Date(response.submittedAt).toLocaleString()}</p>
                  </div>
                  <span className="text-sm text-cyan-100/75">{formatDuration(response.durationMs ?? 0)}</span>
                </div>
              ))}
              {responseItems.length === 0 ? <p className="text-cyan-50/62">No responses yet</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
