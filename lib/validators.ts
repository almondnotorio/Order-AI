import { z } from "zod";

export const submitOrderSchema = z.object({
  raw_input: z
    .string()
    .min(5, "Order description must be at least 5 characters")
    .max(2000, "Order description must be under 2000 characters")
    .trim(),
});

export const updateOrderSchema = z.object({
  status: z
    .enum(["PENDING", "PROCESSING", "REVIEW", "APPROVED", "REJECTED", "FULFILLED"])
    .optional(),
  matched_sku_id: z.string().optional(),
  delivery_type: z.enum(["STANDARD", "RUSH"]).optional(),
  admin_remark: z.string().max(1000).optional(),
});

export const createSkuSchema = z.object({
  sku_code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9\-_.]+$/, "SKU code must be alphanumeric with dashes"),
  description: z.string().min(1).max(255),
  width_in: z.number().positive().max(1000),
  height_in: z.number().positive().max(1000),
  thickness: z.enum([".040", ".063", ".080", ".125"]),
  reflectivity: z.enum(["NONE", "EG", "HIP", "DG3"]),
  sides: z.enum(["SINGLE", "DOUBLE"]),
  material: z.enum(["ALUMINUM", "STEEL", "PLASTIC"]),
});

export const createApiKeySchema = z.object({
  label: z.string().min(1).max(100).trim(),
});

export const skuQuerySchema = z.object({
  material: z.enum(["ALUMINUM", "STEEL", "PLASTIC"]).optional(),
  reflectivity: z.enum(["NONE", "EG", "HIP", "DG3"]).optional(),
  sides: z.enum(["SINGLE", "DOUBLE"]).optional(),
  active: z
    .string()
    .optional()
    .transform((v) => (v === "false" ? false : v === "true" ? true : undefined)),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v || "50", 10), 100)),
});

export const orderQuerySchema = z.object({
  status: z
    .enum(["PENDING", "PROCESSING", "REVIEW", "APPROVED", "REJECTED", "FULFILLED"])
    .optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(parseInt(v || "50", 10), 100)),
  search: z.string().optional(),
});
