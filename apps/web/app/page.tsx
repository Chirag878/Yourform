import Link from "next/link";
import { ArrowRight, BarChart3, CloudRain, FilePlus2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";

const previewTemplates = [
  ["Customer Feedback", "soft-sakura"],
  ["IPL Match Prediction", "stadium-neon"],
  ["Anime Fan Survey", "neon-night"],
  ["Travel Planner", "mist-valley"],
];

export default function Home() {
  return (
    <main className="aurora-shell">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white">
            <span className="flex size-10 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100 shadow-lg shadow-cyan-950/30">
              <CloudRain className="size-5" />
            </span>
            YourForm
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white">
              <Link href="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200/20 bg-white/10 px-3 py-1 text-sm text-cyan-50 backdrop-blur">
              <Sparkles className="size-4 text-pink-200" />
              Monsoon Aurora form builder
            </div>
            <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Build cinematic forms that validate like backend contracts.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-50/78">
              Create templates, publish secure links, collect typed responses, and read analytics from one polished creator cockpit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-pink-200 text-slate-950 hover:bg-pink-100">
                <Link href="/auth">
                  Start building
                  <FilePlus2 />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-cyan-100/30 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href="/dashboard">
                  View demo dashboard
                  <BarChart3 />
                </Link>
              </Button>
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden rounded-lg p-4 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-300 via-cyan-200 to-emerald-300" />
            <div className="grid gap-4">
              <div className="rounded-lg border border-white/10 bg-slate-950/35 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-100/75">Live form</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Travel Planner</h2>
                  </div>
                  <span className="rounded-full border border-emerald-200/30 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100">
                    Published
                  </span>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="progress-glow h-full w-2/3 rounded-full bg-cyan-200" />
                </div>
                <div className="mt-6 grid gap-3">
                  {["Dream destination", "Trip style", "Budget per person"].map((label) => (
                    <div key={label} className="rounded-md border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-cyan-50/85">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {previewTemplates.map(([title, theme]) => (
                  <div key={title} className={`aurora-card theme-${theme} rounded-lg p-4`}>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="mt-2 text-xs text-cyan-50/65">Template ready</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Validation", "Strict Zod"],
                  ["Security", "Rate limited"],
                  ["Analytics", "Charts"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-xs text-cyan-100/65">{label}</p>
                    <p className="mt-1 font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8 text-sm text-cyan-50/60">
          <ShieldCheck className="mr-2 inline size-4" />
          Versioned schemas, ownership checks, authenticated-only responders, and Scalar docs included.
        </div>
      </section>
    </main>
  );
}
