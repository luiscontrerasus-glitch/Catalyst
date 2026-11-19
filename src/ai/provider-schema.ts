import { z } from "zod";
import { proposalSchema } from "./schema";

// Nested array/numeric bounds multiply Gemini's constrained-decoding states.
// Keep the structural contract small; the original strict Zod schema still
// validates every response, including all bounds and cross-field rules.
const applicationConstraints = new Set([
  "$schema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "format",
]);
function simplify(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(simplify);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !applicationConstraints.has(key))
      .map(([key, item]) => [key, simplify(item)]),
  );
}
export const providerProposalSchema = simplify(
  z.toJSONSchema(proposalSchema, { unrepresentable: "any" }),
) as Record<string, unknown>;
