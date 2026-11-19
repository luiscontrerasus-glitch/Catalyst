import { goalSchema, validateProposal, type Proposal } from "./schema";
export type CompilerCode =
  | "unavailable"
  | "invalid_input"
  | "invalid_output"
  | "rate_limit"
  | "credentials"
  | "timeout"
  | "provider";
export class CompilerError extends Error {
  constructor(
    public code: CompilerCode,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export type Generate = (goal: string) => Promise<string | undefined>;
export async function compileGoal(
  input: unknown,
  generate: Generate,
): Promise<Proposal> {
  const request = goalSchema.safeParse(input);
  if (!request.success)
    throw new CompilerError(
      "invalid_input",
      request.error.issues[0].message,
      400,
    );
  let text: string | undefined;
  try {
    text = await generate(request.data.goal);
  } catch (error) {
    if (error instanceof CompilerError) throw error;
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 0;
    if (status === 429)
      throw new CompilerError(
        "rate_limit",
        "Gemini is rate limited. Wait a minute, retry, or continue manually.",
        429,
      );
    if (status === 401 || status === 403)
      throw new CompilerError(
        "credentials",
        "Gemini rejected the server credential or model access. Check the server configuration; manual planning remains available.",
        503,
      );
    if (error instanceof Error && /timeout|abort/i.test(error.name))
      throw new CompilerError(
        "timeout",
        "Gemini took too long. Your draft is unchanged; retry or continue manually.",
        504,
      );
    throw new CompilerError(
      "provider",
      "Gemini could not complete this request. Your draft is unchanged; retry or continue manually.",
      502,
    );
  }
  try {
    if (!text || text.length > 100000)
      throw new Error("Empty or oversized output");
    return validateProposal(JSON.parse(text), request.data.goal);
  } catch {
    throw new CompilerError(
      "invalid_output",
      "Gemini returned an incomplete or invalid plan. Nothing was applied. Retry or build the plan manually.",
      502,
    );
  }
}
