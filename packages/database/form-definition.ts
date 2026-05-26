import {z} from "zod";

const baseFieldSchema = z.object({
  id: z.string().min(2).max(120),
  label: z.string().min(2).max(200),
  required: z.boolean().default(false),
}); 

const  shortTextFieldSchema = baseFieldSchema.extend({
  kind: z.literal("short-text"),
  minLength: z.number().min(0).int(),
  maxLength: z.number().min(1).int(),
  regex: z.string().optional(),
});

const longTextFieldSchema = baseFieldSchema.extend({
  kind: z.literal("long-text"),
  minLength: z.number().min(0).int().optional(),
  maxLength: z.number().min(1).int().optional(),
  regex: z.string().optional(),
});

const emailFieldSchema = baseFieldSchema.extend({
  kind: z.literal("email"),
});

const numberFieldSchema = baseFieldSchema.extend({
  kind: z.literal("number"),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional(),
});

const selectFieldSchema = baseFieldSchema.extend({
  kind: z.literal("select"),
  options: z.array(z.string().min(1)).min(1),
});

const multiSelectFieldSchema = baseFieldSchema.extend({
  kind: z.literal("multi-select"),
  options: z.array(z.string().min(1)).min(1),
  minSelect: z.number().min(1).int().optional(),
  maxSelect: z.number().min(1).int().optional(),
});

const booleanFieldSchema = baseFieldSchema.extend({
  kind: z.literal("boolean"),
});

const dateFieldSchema = baseFieldSchema.extend({
  kind: z.literal("date"),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

export const fieldSchema = z.discriminatedUnion("kind", [
  shortTextFieldSchema,
  longTextFieldSchema,
  emailFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
  booleanFieldSchema,
  dateFieldSchema,
]);

export const formDefinitionSchema = z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(500).optional(),
    fields: z.array(fieldSchema).min(1),
});

export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type Field= z.infer<typeof fieldSchema>;

