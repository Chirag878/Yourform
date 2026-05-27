"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Send } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { FormDefinition, FormField } from "~/lib/forms";
import { trpc } from "~/trpc/client";

type PublicFormPayload = {
  form: {
    id: string;
    title: string;
    description: string | null;
    themeVariant: string;
  };
  versionId?: string;
  definition: FormDefinition | null;
  requiresAuth: boolean;
};

const isEmpty = (field: FormField, value: unknown) => {
  if (field.kind === "boolean") return value === undefined;
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === "";
};

export default function PublicFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const startedAt = useRef(new Date());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const formQuery = trpc.publicForms.getByToken.useQuery({ token }, { retry: false });
  const submit = trpc.publicForms.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Response submitted");
    },
    onError: (error) => toast.error(error.message),
  });

  const payload = formQuery.data as PublicFormPayload | undefined;
  const definition = payload?.definition;
  const fields = definition?.fields ?? [];
  const currentField = fields[step];
  const progress = useMemo(() => (fields.length ? ((step + 1) / fields.length) * 100 : 0), [fields.length, step]);

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  };

  const next = () => {
    if (!currentField) return;
    if (currentField.required && isEmpty(currentField, answers[currentField.id])) {
      toast.error("This field is required");
      return;
    }
    setStep((current) => Math.min(current + 1, fields.length - 1));
  };

  const submitForm = () => {
    const missing = fields.find((field) => field.required && isEmpty(field, answers[field.id]));
    if (missing) {
      toast.error(`${missing.label} is required`);
      setStep(fields.indexOf(missing));
      return;
    }

    submit.mutate({
      token,
      answers,
      honeypot,
      startedAt: startedAt.current.toISOString(),
      durationMs: Date.now() - startedAt.current.getTime(),
    });
  };

  if (formQuery.isLoading) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel rounded-lg p-8 text-cyan-50">Opening form</div>
      </main>
    );
  }

  if (formQuery.error || !payload) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel max-w-lg rounded-lg p-8 text-center">
          <p className="text-xl font-semibold text-white">Form unavailable</p>
          <p className="mt-3 text-cyan-50/68">{formQuery.error?.message ?? "This link is not active."}</p>
        </div>
      </main>
    );
  }

  if (payload.requiresAuth) {
    return (
      <main className={`aurora-shell theme-${payload.form.themeVariant} flex min-h-screen items-center justify-center px-5`}>
        <div className="glass-panel max-w-lg rounded-lg p-8 text-center">
          <Lock className="mx-auto size-10 text-cyan-100" />
          <h1 className="mt-5 text-3xl font-bold text-white">Login required</h1>
          <p className="mt-3 text-cyan-50/70">This creator only accepts authenticated responses.</p>
          <Button asChild className="mt-6 bg-cyan-200 text-slate-950 hover:bg-cyan-100">
            <Link href="/auth">Login</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className={`aurora-shell theme-${definition?.themeVariant ?? payload.form.themeVariant} flex min-h-screen items-center justify-center px-5`}>
        <div className="glass-panel success-spark max-w-xl rounded-lg p-10 text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-200" />
          <h1 className="mt-6 text-4xl font-bold text-white">Submitted</h1>
          <p className="mt-3 text-cyan-50/75">Your response is safely captured.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`aurora-shell theme-${definition?.themeVariant ?? payload.form.themeVariant} min-h-screen px-5 py-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        <div className="glass-panel rounded-lg p-5 sm:p-8">
          <div className="mb-8">
            <p className="text-sm text-cyan-100/70">{definition?.category ?? "Form"}</p>
            <h1 className="mt-2 text-4xl font-bold text-white">{definition?.title ?? payload.form.title}</h1>
            <p className="mt-3 text-cyan-50/68">{definition?.description ?? payload.form.description}</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="progress-glow h-full rounded-full bg-cyan-200 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <input className="hidden" tabIndex={-1} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} aria-hidden="true" />

          {currentField ? (
            <div className="min-h-[260px] animate-in fade-in slide-in-from-right-2 duration-300">
              <p className="text-sm text-cyan-50/55">
                {step + 1} of {fields.length}
              </p>
              <label className="mt-3 block text-2xl font-semibold text-white">{currentField.label}</label>
              {currentField.description ? <p className="mt-2 text-cyan-50/65">{currentField.description}</p> : null}
              <div className="mt-6">{renderField(currentField, answers[currentField.id], (value) => setAnswer(currentField.id, value))}</div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              <ChevronLeft />
              Back
            </Button>
            {step === fields.length - 1 ? (
              <Button onClick={submitForm} disabled={submit.isPending} className="bg-pink-200 text-slate-950 hover:bg-pink-100">
                <Send />
                Submit
              </Button>
            ) : (
              <Button onClick={next} className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
                Next
                <ChevronRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function renderField(field: FormField, value: unknown, onChange: (value: unknown) => void) {
  const inputClass = "bg-white/10 text-lg";
  if (field.kind === "long-text") {
    return <Textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass} rows={6} />;
  }
  if (field.kind === "email") {
    return <Input type="email" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass} />;
  }
  if (field.kind === "number") {
    return <Input type="number" value={String(value ?? "")} onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))} className={inputClass} />;
  }
  if (field.kind === "date") {
    return <Input type="date" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass} />;
  }
  if (field.kind === "select") {
    return (
      <div className="grid gap-3">
        {(field.options ?? []).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-md border px-4 py-3 text-left transition ${
              value === option ? "border-cyan-200 bg-cyan-200/18 text-white" : "border-white/10 bg-white/[0.06] text-cyan-50/76 hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }
  if (field.kind === "multi-select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="grid gap-3">
        {(field.options ?? []).map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-cyan-50">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option));
              }}
              className="size-4 accent-cyan-200"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }
  if (field.kind === "boolean") {
    return (
      <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-cyan-50">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-cyan-200" />
        Yes
      </label>
    );
  }
  return <Input value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass} />;
}
