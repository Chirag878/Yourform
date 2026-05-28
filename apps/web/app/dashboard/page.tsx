"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CloudRain,
  Copy,
  FileText,
  LogOut,
  Pencil,
  Plus,
  Sparkles,
  QrCode,
  Trash2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { clearAuthToken, getAuthToken } from "~/lib/auth-token";
import { trpc } from "~/trpc/client";

type TemplateCard = {
  key: string;
  title: string;
  description: string;
  category: string;
  themeVariant: string;
  fieldsCount: number;
};

type FormCard = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  responseAuthMode: string;
  themeVariant: string;
  publicUrl: string;
  isPublished: boolean;
  responseCount?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [hasToken, setHasToken] = useState(false);
  const [draftTitle, setDraftTitle] = useState("Untitled mist form");
  const [activeQrUrl, setActiveQrUrl] = useState<string | null>(null);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  const me = trpc.auth.me.useQuery(undefined, {
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    if (me.data && !me.data.emailVerified) {
      router.push("/auth/verify");
    }
  }, [me.data, router]);

  const forms = trpc.forms.listMine.useQuery(
    { limit: 50, offset: 0 },
    {
      enabled: hasToken,
      retry: false,
    },
  );
  const templates = trpc.templates.listTemplates.useQuery(undefined);

  const deleteFormMutation = trpc.forms.delete.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully");
      utils.forms.listMine.invalidate();
      setDeleteFormId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const createDraft = trpc.forms.createDraft.useMutation({
    onSuccess: (form) => {
      toast.success("Draft created");
      utils.forms.listMine.invalidate();
      window.location.href = `/builder/${form.id}`;
    },
    onError: (error) => toast.error(error.message),
  });

  const createFromTemplate = trpc.templates.createFromTemplate.useMutation({
    onSuccess: (form) => {
      toast.success("Template copied");
      utils.forms.listMine.invalidate();
      window.location.href = `/builder/${form.id}`;
    },
    onError: (error) => toast.error(error.message),
  });

  const logout = () => {
    clearAuthToken();
    setHasToken(false);
    toast.success("Logged out");
  };

  const copyPublicLink = (form: FormCard) => {
    const url = `${window.location.origin}${form.publicUrl}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied");
  };

  if (!hasToken || me.error) {
    return (
      <main className="aurora-shell flex min-h-screen items-center justify-center px-5 py-10">
        <div className="glass-panel max-w-xl rounded-lg p-8 text-center">
          <CloudRain className="mx-auto size-10 text-cyan-100" />
          <h1 className="mt-5 text-3xl font-bold text-white">Creator access</h1>
          <p className="mt-3 text-cyan-50/70">Login or create an account to manage forms and analytics.</p>
          <Button asChild className="mt-6 bg-cyan-200 text-slate-950 hover:bg-cyan-100">
            <Link href="/auth">Continue</Link>
          </Button>
        </div>
      </main>
    );
  }

  const formItems = (forms.data ?? []) as FormCard[];
  const templateItems = (templates.data ?? []) as TemplateCard[];
  const totalResponses = formItems.reduce((sum, form) => sum + (form.responseCount ?? 0), 0);

  return (
    <main className="aurora-shell min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
            <span className="flex size-10 items-center justify-center rounded-md border border-cyan-200/30 bg-white/10 text-cyan-100">
              <CloudRain className="size-5" />
            </span>
            YourForm
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-cyan-50/70 sm:block">{me.data?.email}</span>
            <Button variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white" onClick={logout}>
              <LogOut />
              Logout
            </Button>
          </div>
        </nav>

        <header className="mt-10 grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="glass-panel rounded-lg p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm text-pink-100/80">
              <Sparkles className="size-4" />
              Creator dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Forms, responses, and analytics.</h1>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Forms", formItems.length],
                ["Responses", totalResponses],
                ["Published", formItems.filter((form) => form.isPublished).length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-sm text-cyan-50/62">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <Label htmlFor="draftTitle">New custom form</Label>
            <div className="mt-3 flex gap-2">
              <Input
                id="draftTitle"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="bg-white/10"
              />
              <Button
                onClick={() =>
                  createDraft.mutate({
                    title: draftTitle,
                    description: "Custom form",
                    visibility: "Unlisted",
                    responseAuthMode: "PUBLIC",
                    themeVariant: "mist-valley",
                  })
                }
                disabled={createDraft.isPending}
                className="bg-pink-200 text-slate-950 hover:bg-pink-100"
              >
                <Plus />
              </Button>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Your forms</h2>
            <span className="text-sm text-cyan-50/60">{forms.isLoading ? "Loading" : `${formItems.length} forms`}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {formItems.map((form) => (
              <div key={form.id} className={`aurora-card theme-${form.themeVariant} rounded-lg p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-50/55">{form.visibility}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{form.title}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-cyan-50/75">
                    {form.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-cyan-50/66">{form.description ?? "No description"}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <p className="text-cyan-50/55">Responses</p>
                    <p className="mt-1 font-semibold text-white">{form.responseCount ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <p className="text-cyan-50/55">Responder</p>
                    <p className="mt-1 font-semibold text-white">{form.responseAuthMode === "PUBLIC" ? "Public" : "Auth"}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
                    <Link href={`/builder/${form.id}`}>
                      <Pencil />
                      Build
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                    <Link href={`/forms/${form.id}/analytics`}>
                      <BarChart3 />
                      Analytics
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                    <Link href={`/forms/${form.id}/responses`}>
                      <FileText />
                      Responses
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white" onClick={() => copyPublicLink(form)}>
                    <Copy />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-cyan-50 hover:bg-white/10 hover:text-white" onClick={() => {
                    const url = `${window.location.origin}${form.publicUrl}`;
                    setActiveQrUrl(url);
                  }}>
                    <QrCode className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-pink-300 hover:bg-pink-500/10 hover:text-pink-50" onClick={() => setDeleteFormId(form.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 pb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Template catalog</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {templateItems.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() =>
                  createFromTemplate.mutate({
                    templateKey: template.key,
                    visibility: "Unlisted",
                    responseAuthMode: "PUBLIC",
                  })
                }
                className={`aurora-card theme-${template.themeVariant} rounded-lg p-4 text-left`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-50/55">{template.category}</p>
                <h3 className="mt-2 font-semibold text-white">{template.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-cyan-50/64">{template.description}</p>
                <p className="mt-4 text-xs text-cyan-100/70">{template.fieldsCount} fields</p>
              </button>
            ))}
          </div>
        </section>

        {activeQrUrl && (
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeQrUrl)}`}
                  alt="QR Code"
                  className="size-[180px]"
                />
              </div>
              <Button
                onClick={() => setActiveQrUrl(null)}
                className="w-full bg-cyan-200 text-slate-950 hover:bg-cyan-100 font-medium"
              >
                Close Modal
              </Button>
            </div>
          </div>
        )}

        {deleteFormId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-sm rounded-lg p-6 sm:p-8 text-center space-y-6 border border-pink-500/30">
              <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Trash2 className="size-6 text-pink-400" /> Delete Form?
              </h2>
              <p className="text-sm text-cyan-50/70">
                Are you sure you want to delete this form? This action is permanent and will permanently delete all form data, versions, and respondent submissions!
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setDeleteFormId(null)}
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteFormMutation.mutate({ formId: deleteFormId })}
                  disabled={deleteFormMutation.isPending}
                  className="flex-1 bg-pink-500 text-white hover:bg-pink-600 font-medium"
                >
                  {deleteFormMutation.isPending ? "Deleting..." : "Yes, Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
