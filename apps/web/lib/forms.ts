export const themeVariants = [
  "soft-sakura",
  "zen-slate",
  "lantern-pulse",
  "aurora-grid",
  "stadium-neon",
  "neon-night",
  "mist-valley",
] as const;

export const fieldKinds = [
  "short-text",
  "long-text",
  "email",
  "number",
  "select",
  "multi-select",
  "boolean",
  "date",
] as const;

export type ThemeVariant = (typeof themeVariants)[number];
export type FieldKind = (typeof fieldKinds)[number];

export type FormField = {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  kind: FieldKind;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  options?: string[];
  minSelect?: number;
  maxSelect?: number;
  minDate?: string;
  maxDate?: string;
};

export type FormDefinition = {
  title: string;
  description?: string;
  category?: string;
  themeVariant: ThemeVariant;
  fields: FormField[];
};

export const createField = (kind: FieldKind, index: number): FormField => {
  const id = `${kind.replace(/-/g, "_")}_${index}`;
  const base = {
    id,
    label: kind
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" "),
    required: false,
    kind,
  };

  if (kind === "short-text") return { ...base, minLength: 1, maxLength: 160 };
  if (kind === "long-text") return { ...base, minLength: 0, maxLength: 1200 };
  if (kind === "select") return { ...base, options: ["Option A", "Option B"] };
  if (kind === "multi-select") return { ...base, options: ["Option A", "Option B"], minSelect: 1, maxSelect: 2 };
  if (kind === "number") return { ...base, min: 0, max: 100 };
  return base;
};

export const compactOptions = (value?: string[]) => (value ?? []).filter(Boolean).join(", ");
export const parseOptions = (value: string) =>
  value
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
