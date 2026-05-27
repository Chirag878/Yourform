import { z } from "zod";
import type { Field, FormDefinition } from "./form-definition";

const assertNever = (x: never): never => {
  throw new Error(`Unhandled field kind: ${JSON.stringify(x)}`);
};

const emptyToUndefined = (value: unknown) => {
  if (value === "") return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  return value;
};

const applyRequired = <T extends z.ZodTypeAny>(schema: T, required?: boolean) => {
  return required ? schema : z.preprocess(emptyToUndefined, schema.optional());
};

const baseFieldSchema = (field: Field): z.ZodTypeAny => {
  switch (field.kind) {
    case "short-text": {
      let s = z.string();
      if (field.minLength !== undefined) s = s.min(field.minLength);
      if (field.maxLength !== undefined) s = s.max(field.maxLength);
      if (field.regex) s = s.regex(new RegExp(field.regex), "Invalid format");
      return applyRequired(s, field.required);
    }
    case "long-text": {
      let s = z.string();
      if (field.minLength !== undefined) s = s.min(field.minLength);
      if (field.maxLength !== undefined) s = s.max(field.maxLength);
      if (field.regex) s = s.regex(new RegExp(field.regex), "Invalid format");
      return applyRequired(s, field.required);
    }
    case "email":
      return applyRequired(z.string().email("Invalid email"), field.required);
    case "number": {
      let n = z.coerce.number();
      if (field.min !== undefined) n = n.min(field.min);
      if (field.max !== undefined) n = n.max(field.max);
      if (field.integer) n = n.int();
      return applyRequired(n, field.required);
    }
    case "select": {
      const opts = new Set(field.options);
      return applyRequired(z.string().refine((v) => opts.has(v), "Invalid option"), field.required);
    }
    case "multi-select": {
      const opts = new Set(field.options);
      let arr = z.array(z.string().refine((v) => opts.has(v), "Invalid option"));
      if (field.minSelect !== undefined) arr = arr.min(field.minSelect);
      if (field.maxSelect !== undefined) arr = arr.max(field.maxSelect);
      return applyRequired(arr, field.required);
    }
    case "boolean":
      return applyRequired(z.boolean(), field.required);
    case "date":
      return applyRequired(
        z
          .string()
          .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
          .refine((v) => !field.minDate || Date.parse(v) >= Date.parse(field.minDate), "Date is too early")
          .refine((v) => !field.maxDate || Date.parse(v) <= Date.parse(field.maxDate), "Date is too late"),
        field.required,
      );

    default:
      return assertNever(field);
    }
};

export const compileToSubmissionSchema = (form: FormDefinition) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of form.fields) {
    shape[field.id] = baseFieldSchema(field);
  }

  return z.object(shape).strict();
};

export const compileTosubmissionSchema = compileToSubmissionSchema;
