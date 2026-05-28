"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Eye, Plus, Rocket, Save, Trash2, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  compactOptions,
  createField,
  fieldKinds,
  parseOptions,
  themeVariants,
  type FieldKind,
  type FormDefinition,
  type FormField,
  type ThemeVariant,
} from "~/lib/forms";
import { trpc } from "~/trpc/client";

const selectClass =
  "h-9 rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-200/40";

const parseNumber = (value: string) => (value === "" ? undefined : Number(value));
const getSchemaJson = (currentVersion: unknown) =>
  (currentVersion as { schemaJson?: FormDefinition } | undefined)?.schemaJson;

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;
  const utils = trpc.useUtils();
  const [visibility, setVisibility] = useState<"Public" | "Unlisted" | "Private">("Unlisted");
  const [responseAuthMode, setResponseAuthMode] = useState<"PUBLIC" | "AUTHENTICATED">("PUBLIC");
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [showQr, setShowQr] = useState(false);

  const form = trpc.forms.getById.useQuery({ formId }, { retry: false });

  useEffect(() => {
    if (!form.data || definition) return;
    const schema = getSchemaJson(form.data.currentVersion);
    if (!schema) return;
    setDefinition(schema);
    setVisibility(form.data.visibility as "Public" | "Unlisted" | "Private");
    setResponseAuthMode(form.data.responseAuthMode as "PUBLIC" | "AUTHENTICATED");
  }, [definition, form.data]);

  const updateSchema = trpc.forms.updateDraftSchema.useMutation({
    onSuccess: (updated) => {
      toast.success("Draft saved");
      utils.forms.getById.invalidate({ formId });
      const schema = getSchemaJson(updated.currentVersion);
      if (schema) setDefinition(schema);
    },
    onError: (error) => toast.error(error.message),
  });

  const publish = trpc.forms.publish.useMutation({
    onSuccess: (updated) => {
      toast.success("Form published");
      utils.forms.getById.invalidate({ formId });
      const schema = getSchemaJson(updated.currentVersion);
      if (schema) setDefinition(schema);
    },
    onError: (error) => toast.error(error.message),
  });

  const publicUrl = useMemo(() => {
    if (!form.data || typeof window === "undefined") return "";
    return `${window.location.origin}${form.data.publicUrl}`;
  }, [form.data]);

  const updateDefinition = (patch: Partial<FormDefinition>) => {
    setDefinition((current) => (current ? { ...current, ...patch } : current));
  };

  const updateField = (index: number, patch: Partial<FormField>) => {
    setDefinition((current) => {
      if (!current) return current;
      const fields = [...current.fields];
      fields[index] = { ...fields[index], ...patch } as FormField;
      return { ...current, fields };
    });
  };

  const addField = (kind: FieldKind) => {
    setDefinition((current) => {
      if (!current) return current;
      return { ...current, fields: [...current.fields, createField(kind, current.fields.length + 1)] };
    });
  };

  const removeField = (index: number) => {
    setDefinition((current) => {
      if (!current || current.fields.length === 1) return current;
      return { ...current, fields: current.fields.filter((_, fieldIndex) => fieldIndex !== index) };
    });
  };

  const save = () => {
    if (!definition) return;
    updateSchema.mutate({
      formId,
      definition: definition as never,
      visibility,
      responseAuthMode,
      themeVariant: definition.themeVariant,
    });
  };

  if (form.isLoading || !definition) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel rounded-lg p-8 text-cyan-50">Loading builder</div>
      </main>
    );
  }

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
    <main className={`aurora-shell theme-${definition.themeVariant} min-h-screen px-5 py-6 sm:px-8 lg:px-10`}>
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white">
            <Link href="/dashboard">
              <ArrowLeft />
              Dashboard
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {form.data?.isPublished ? (
              <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href={form.data.publicUrl} target="_blank">
                  <Eye />
                  Preview
                </Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Link copied");
              }}
            >
              <Copy />
              Copy link
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setShowQr(true)}
            >
              <QrCode className="size-4" />
              Share QR
            </Button>
            <Button onClick={save} disabled={updateSchema.isPending} className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
              <Save />
              Save
            </Button>
            <Button
              onClick={() => publish.mutate({ formId })}
              disabled={publish.isPending}
              className="bg-pink-200 text-slate-950 hover:bg-pink-100"
            >
              <Rocket />
              Publish
            </Button>
          </div>
        </nav>

        <header className="glass-panel mt-6 rounded-lg p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={definition.title}
                  onChange={(event) => updateDefinition({ title: event.target.value })}
                  className="mt-2 bg-white/10 text-2xl font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={definition.description ?? ""}
                  onChange={(event) => updateDefinition({ description: event.target.value })}
                  className="mt-2 bg-white/10"
                />
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <Label>Visibility</Label>
                <select className={`mt-2 w-full ${selectClass}`} value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)}>
                  <option value="Public">Public</option>
                  <option value="Unlisted">Unlisted</option>
                  <option value="Private">Private</option>
                </select>
              </div>
              <div>
                <Label>Responder auth</Label>
                <select
                  className={`mt-2 w-full ${selectClass}`}
                  value={responseAuthMode}
                  onChange={(event) => setResponseAuthMode(event.target.value as typeof responseAuthMode)}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="AUTHENTICATED">Authenticated only</option>
                </select>
              </div>
              <div>
                <Label>Theme</Label>
                <select
                  className={`mt-2 w-full ${selectClass}`}
                  value={definition.themeVariant}
                  onChange={(event) => updateDefinition({ themeVariant: event.target.value as ThemeVariant })}
                >
                  {themeVariants.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="glass-panel h-fit rounded-lg p-5">
            <h2 className="font-semibold text-white">Add field</h2>
            <div className="mt-4 grid gap-2">
              {fieldKinds.map((kind) => (
                <Button
                  key={kind}
                  variant="ghost"
                  className="justify-start text-cyan-50 hover:bg-white/10 hover:text-white"
                  onClick={() => addField(kind)}
                >
                  <Plus />
                  {kind}
                </Button>
              ))}
            </div>
          </aside>

          <section className="grid gap-4">
            {definition.fields.map((field, index) => (
              <div key={`${field.id}-${index}`} className="aurora-card rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-50/55">{field.kind}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{field.label}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-pink-100 hover:bg-pink-500/10 hover:text-pink-50"
                    onClick={() => removeField(index)}
                    disabled={definition.fields.length === 1}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Field id</Label>
                    <Input value={field.id} onChange={(event) => updateField(index, { id: event.target.value })} className="mt-2 bg-white/10" />
                  </div>
                  <div>
                    <Label>Label</Label>
                    <Input value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} className="mt-2 bg-white/10" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select className={`mt-2 w-full ${selectClass}`} value={field.kind} onChange={(event) => updateField(index, createField(event.target.value as FieldKind, index + 1))}>
                      {fieldKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-end gap-3 rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-cyan-50">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) => updateField(index, { required: event.target.checked })}
                      className="size-4 accent-cyan-200"
                    />
                    Required
                  </label>
                </div>

                {["short-text", "long-text"].includes(field.kind) ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Min length</Label>
                      <Input type="number" value={field.minLength ?? ""} onChange={(event) => updateField(index, { minLength: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                    </div>
                    <div>
                      <Label>Max length</Label>
                      <Input type="number" value={field.maxLength ?? ""} onChange={(event) => updateField(index, { maxLength: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                    </div>
                    <div>
                      <Label>Regex</Label>
                      <Input value={field.regex ?? ""} onChange={(event) => updateField(index, { regex: event.target.value || undefined })} className="mt-2 bg-white/10" />
                    </div>
                  </div>
                ) : null}

                {field.kind === "number" ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Min</Label>
                      <Input type="number" value={field.min ?? ""} onChange={(event) => updateField(index, { min: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                    </div>
                    <div>
                      <Label>Max</Label>
                      <Input type="number" value={field.max ?? ""} onChange={(event) => updateField(index, { max: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                    </div>
                    <label className="flex items-end gap-3 rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-cyan-50">
                      <input
                        type="checkbox"
                        checked={Boolean(field.integer)}
                        onChange={(event) => updateField(index, { integer: event.target.checked })}
                        className="size-4 accent-cyan-200"
                      />
                      Integer
                    </label>
                  </div>
                ) : null}

                {["select", "multi-select"].includes(field.kind) ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <Label>Options</Label>
                      <OptionsInput
                        options={field.options}
                        onChange={(opts) => updateField(index, { options: opts })}
                      />
                    </div>
                    {field.kind === "multi-select" ? (
                      <>
                        <div>
                          <Label>Min selected</Label>
                          <Input type="number" value={field.minSelect ?? ""} onChange={(event) => updateField(index, { minSelect: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                        </div>
                        <div>
                          <Label>Max selected</Label>
                          <Input type="number" value={field.maxSelect ?? ""} onChange={(event) => updateField(index, { maxSelect: parseNumber(event.target.value) })} className="mt-2 bg-white/10" />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        </div>
        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-sm rounded-lg p-6 sm:p-8 text-center space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <QrCode className="size-6 text-cyan-400" /> Share QR Code
              </h2>
              <p className="text-sm text-cyan-50/70">
                Scan this code to instantly load and complete your public form.
              </p>
              <div className="flex justify-center bg-white p-4 rounded-md mx-auto w-fit border border-cyan-200/20 shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`}
                  alt="QR Code"
                  className="size-[180px]"
                />
              </div>
              <Button
                onClick={() => setShowQr(false)}
                className="w-full bg-cyan-200 text-slate-950 hover:bg-cyan-100 font-medium"
              >
                Close Modal
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface OptionsInputProps {
  options?: string[];
  onChange: (options: string[]) => void;
}

function OptionsInput({ options, onChange }: OptionsInputProps) {
  const [localValue, setLocalValue] = useState(() => (options ?? []).join(", "));

  useEffect(() => {
    const propOptions = options ?? [];
    const localParsed = localValue
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean);

    const isEquivalent =
      propOptions.length === localParsed.length &&
      propOptions.every((val, idx) => val === localParsed[idx]);

    if (!isEquivalent) {
      setLocalValue(propOptions.join(", "));
    }
  }, [options]);

  const handleChange = (val: string) => {
    setLocalValue(val);
    const parsed = val
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  return (
    <Input
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      className="mt-2 bg-white/10"
      placeholder="e.g. Option A, Option B, Option C"
    />
  );
}
