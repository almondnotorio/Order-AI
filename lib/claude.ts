import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { SKU } from "@/app/generated/prisma/client";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a signage order processing assistant for a professional sign manufacturing company.
Your job is to extract structured product attributes from natural language order requests and match them to the SKU catalog.

## Attribute Definitions

DIMENSIONS: Width x Height in inches.
- Accept formats: "6 by 18", "6x18", "6 inch by 18 inch", "half-sheet" (=12x18), "full sheet" (=24x36)
- If only one dimension given, set the other to null and flag it.

THICKNESS: Aluminum gauge in decimal inches. Valid values: .040, .063, .080, .125
- .040 = standard thin gauge (most common)
- .063 = medium gauge
- .080 = heavy gauge
- .125 = heavy duty (1/8 inch)
- If unspecified, default to .040 and add a flag.

REFLECTIVITY: Valid values: NONE, EG, HIP, DG3
- NONE = no reflectivity (non-reflective)
- EG = Engineer Grade (lowest, cheapest, "type 1", "engineer grade")
- HIP = High Intensity Prismatic (medium, "high intensity", "prismatic", "type 3", "type III")
- DG3 = Diamond Grade (highest, "diamond grade", "type 9", "type IX", DOT highway standard)
- If unspecified, it is ambiguous — set to null and flag it.

SIDES: SINGLE or DOUBLE
- SINGLE: "one sided", "single sided", "one side", "ss"
- DOUBLE: "double sided", "both sides", "two sided", "ds"
- If unspecified, default to SINGLE and add a flag.

MATERIAL: ALUMINUM, STEEL, or PLASTIC
- Default to ALUMINUM (do NOT flag if unspecified — aluminum is the standard default)

DELIVERY: STANDARD or RUSH
- RUSH: "rush", "urgent", "ASAP", "expedited", "next day", "fast"
- Default to STANDARD (do not flag if unspecified)

QUANTITY: Integer. Default to 1 if not mentioned (do not flag if unspecified).

## Confidence Scoring
- 1.0 = exact match all attributes specified clearly
- 0.9 = one minor attribute defaulted or inferred with confidence
- 0.7–0.8 = one or two attributes ambiguous or inferred
- 0.5–0.6 = multiple attributes missing or uncertain
- < 0.5 = major missing info, contradictory, or no reasonable match

## Flag Rules
Add a human-readable flag string for:
- Any attribute that was defaulted (except material defaulting to ALUMINUM and delivery defaulting to STANDARD)
- Any attribute that is ambiguous or contradictory
- Dimensions not found in catalog
- No matching SKU found
- Quantity > 500 (unusual, possible typo)
- Conflicting attributes (e.g., .080 thickness with EG reflectivity — this combo doesn't exist)`;

const aiResultSchema = z.object({
  parsed: z.object({
    width_in: z.number().nullable(),
    height_in: z.number().nullable(),
    thickness: z.enum([".040", ".063", ".080", ".125"]).nullable(),
    reflectivity: z.enum(["NONE", "EG", "HIP", "DG3"]).nullable(),
    sides: z.enum(["SINGLE", "DOUBLE"]).nullable(),
    material: z.enum(["ALUMINUM", "STEEL", "PLASTIC"]).nullable(),
    delivery: z.enum(["STANDARD", "RUSH"]),
    quantity: z.number().int().positive(),
  }),
  matched_sku_code: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  flags: z.array(z.string()),
  notes: z.string(),
});

export type AIOrderResult = z.infer<typeof aiResultSchema>;

function buildUserMessage(rawInput: string, skuCatalog: SKU[]): string {
  const catalogLines = skuCatalog
    .filter((s) => s.active)
    .map(
      (s) =>
        `  ${s.sku_code}: ${s.width_in}x${s.height_in}" | ${s.thickness} | ${s.reflectivity} | ${s.sides} | ${s.material}`
    )
    .join("\n");

  return `## Available SKU Catalog\n${catalogLines}\n\n## Customer Order Input\n"${rawInput}"`;
}

// Rule-based fallback parser used when the AI API is unavailable (e.g. quota exceeded).
function processOrderWithRules(rawInput: string, skuCatalog: SKU[]): AIOrderResult {
  const text = rawInput.toLowerCase();
  const flags: string[] = [];

  // Dimensions
  let width_in: number | null = null;
  let height_in: number | null = null;

  if (/half[\s-]sheet/.test(text)) {
    width_in = 12; height_in = 18;
  } else if (/full[\s-]sheet/.test(text)) {
    width_in = 24; height_in = 36;
  } else {
    const dimMatch =
      text.match(/(\d+(?:\.\d+)?)\s*(?:in(?:ch(?:es)?)?)?\s*(?:by|x)\s*(\d+(?:\.\d+)?)/i);
    if (dimMatch) {
      width_in = parseFloat(dimMatch[1]);
      height_in = parseFloat(dimMatch[2]);
    } else {
      flags.push("Dimensions could not be determined — manual review required");
    }
  }

  // Thickness
  let thickness: ".040" | ".063" | ".080" | ".125" | null = null;
  if (/\.125|1\/8|heavy[\s-]duty/.test(text)) thickness = ".125";
  else if (/\.080|heavy/.test(text)) thickness = ".080";
  else if (/\.063|medium/.test(text)) thickness = ".063";
  else if (/\.040|standard|thin/.test(text)) thickness = ".040";
  else {
    thickness = ".040";
    flags.push("Thickness not specified — defaulted to .040");
  }

  // Reflectivity
  let reflectivity: "NONE" | "EG" | "HIP" | "DG3" | null = null;
  if (/diamond[\s-]grade|dg3|type\s*9|type\s*ix/.test(text)) reflectivity = "DG3";
  else if (/high[\s-]intensity|prismatic|hip|type\s*3|type\s*iii/.test(text)) reflectivity = "HIP";
  else if (/engineer[\s-]grade|eg\b|type\s*1\b/.test(text)) reflectivity = "EG";
  else if (/non[\s-]reflective|no[\s-]reflectiv|none/.test(text)) reflectivity = "NONE";
  else flags.push("Reflectivity not specified — manual review required");

  // Sides
  let sides: "SINGLE" | "DOUBLE" | null = null;
  if (/double[\s-]sided|both sides|two[\s-]sided|\bds\b/.test(text)) sides = "DOUBLE";
  else if (/single[\s-]sided|one[\s-]side[d]?|\bss\b/.test(text)) sides = "SINGLE";
  else {
    sides = "SINGLE";
    flags.push("Sides not specified — defaulted to SINGLE");
  }

  // Material
  let material: "ALUMINUM" | "STEEL" | "PLASTIC" = "ALUMINUM";
  if (/\bsteel\b/.test(text)) material = "STEEL";
  else if (/\bplastic\b/.test(text)) material = "PLASTIC";

  // Delivery
  const delivery: "STANDARD" | "RUSH" =
    /\brush\b|urgent|asap|expedited|next[\s-]day|\bfast\b/.test(text) ? "RUSH" : "STANDARD";

  // Quantity
  const qtyMatch = text.match(/\b(\d+)\s*(?:signs?|pcs?|pieces?|units?|ea\.?)\b/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  if (quantity > 500) flags.push("Quantity > 500 — possible typo, manual review required");

  // SKU matching
  const activeSKUs = skuCatalog.filter((s) => s.active);
  let matched_sku_code: string | null = null;
  let confidence_score = 0.3; // base confidence for rule-based

  if (width_in && height_in && reflectivity) {
    const match = activeSKUs.find(
      (s) =>
        s.width_in === width_in &&
        s.height_in === height_in &&
        s.thickness === thickness &&
        s.reflectivity === reflectivity &&
        s.sides === sides &&
        s.material === material
    );
    if (match) {
      matched_sku_code = match.sku_code;
      confidence_score = flags.length === 1 ? 0.75 : 0.6; // higher when only the fallback flag
    } else {
      flags.push("No matching SKU found — manual review required");
      confidence_score = 0.3;
    }
  } else {
    flags.push("Insufficient attributes to match a SKU — manual review required");
  }

  return {
    parsed: { width_in, height_in, thickness, reflectivity, sides, material, delivery, quantity },
    matched_sku_code,
    confidence_score,
    flags,
    notes: "Processed by rule-based parser.",
  };
}

function verifySkuInCatalog(result: AIOrderResult, skuCatalog: SKU[]): AIOrderResult {
  if (!result.matched_sku_code) return result;
  const exists = skuCatalog.some(
    (s) => s.sku_code === result.matched_sku_code && s.active
  );
  if (!exists) {
    result.matched_sku_code = null;
    result.flags.push("AI suggested SKU was not found in the active catalog");
    result.confidence_score = Math.min(result.confidence_score, 0.4);
  }
  return result;
}

export async function processOrderWithAI(
  rawInput: string,
  skuCatalog: SKU[]
): Promise<AIOrderResult> {
  try {
    const response = await client.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(rawInput, skuCatalog) },
      ],
      response_format: zodResponseFormat(aiResultSchema, "order_result"),
    });

    const validated = response.choices[0].message.parsed;
    if (!validated) {
      throw new Error("AI response could not be parsed into the expected schema");
    }

    return verifySkuInCatalog(validated, skuCatalog);
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return verifySkuInCatalog(processOrderWithRules(rawInput, skuCatalog), skuCatalog);
    }
    throw err;
  }
}
