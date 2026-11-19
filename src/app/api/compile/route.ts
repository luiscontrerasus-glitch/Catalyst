import { compileGoal, CompilerError } from "@/ai/compiler";
import { generateProposal, providerStatus } from "@/ai/provider.server";
import { applicationOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
let requests: number[] = [];
const headers = { "Cache-Control": "no-store" };
export function GET() {
  return Response.json(providerStatus(), { headers });
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== applicationOrigin(request))
    return Response.json(
      { error: "Request origin is not allowed." },
      { status: 403, headers },
    );
  try {
    const body = await request.text();
    if (body.length > 12000)
      throw new CompilerError(
        "invalid_input",
        "Keep your idea under 5,000 characters.",
        413,
      );
    let input: unknown;
    try {
      input = JSON.parse(body);
    } catch {
      throw new CompilerError(
        "invalid_input",
        "Send a valid JSON project goal.",
        400,
      );
    }
    if (!providerStatus().configured)
      throw new CompilerError(
        "unavailable",
        "Live AI is unavailable. Configure GEMINI_API_KEY on the server and restart. Manual project creation is fully available.",
        503,
      );
    const now = Date.now();
    requests = requests.filter((t) => now - t < 60000);
    if (requests.length >= 5)
      throw new CompilerError(
        "rate_limit",
        "Five drafts per minute are allowed locally. Wait a minute or continue manually.",
        429,
      );
    requests.push(now);
    const proposal = await compileGoal(input, generateProposal);
    return Response.json(
      {
        proposal,
        provider: providerStatus().provider,
        model: providerStatus().model,
      },
      { headers },
    );
  } catch (error) {
    const e =
      error instanceof CompilerError
        ? error
        : new CompilerError(
            "provider",
            "The compiler could not complete this request. Continue manually or retry.",
            502,
          );
    // Do not serialize, log, or return provider errors; they can contain secrets.
    return Response.json(
      { code: e.code, error: e.message },
      {
        status: e.status,
        headers: {
          ...headers,
          ...(e.status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}
