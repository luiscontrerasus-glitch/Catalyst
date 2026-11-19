import "server-only";
import { z } from "zod";
import { RoomError } from "./model";
import { applicationOrigin } from "@/lib/request-origin";
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
};
export function roomToken(request: Request, id: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`catalyst_room_${id}=`))
    ?.split("=")[1];
}
export function sessionCookie(request: Request, id: string, token: string) {
  const secure = (
    process.env.APP_ORIGIN ?? new URL(request.url).origin
  ).startsWith("https:");
  return `catalyst_room_${id}=${token}; Path=/api/rooms/${id}; HttpOnly; SameSite=Strict; Max-Age=2592000${secure ? "; Secure" : ""}`;
}
const attempts = new Map<string, { start: number; count: number }>();
export async function roomBody(request: Request) {
  const expected = applicationOrigin(request);
  if (request.headers.get("origin") !== expected)
    throw new RoomError(
      403,
      "origin",
      "This request must come from the same application origin.",
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new RoomError(415, "content_type", "Send JSON project data.");
  const key = new URL(request.url).pathname.split("/").slice(0, 5).join("/"),
    time = Date.now(),
    limit = attempts.get(key);
  if (!limit || time - limit.start > 60000)
    attempts.set(key, { start: time, count: 1 });
  else if (++limit.count > 120)
    throw new RoomError(
      429,
      "rate_limit",
      "Too many room changes. Wait a minute and retry.",
    );
  if (attempts.size > 1000)
    for (const [k, v] of attempts)
      if (time - v.start > 60000) attempts.delete(k);
  if (Number(request.headers.get("content-length")) > 256000)
    throw new RoomError(
      413,
      "too_large",
      "This project is too large for the prototype.",
    );
  const reader = request.body?.getReader();
  let text = "",
    size = 0;
  if (reader) {
    const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 256000) {
        await reader.cancel();
        throw new RoomError(
          413,
          "too_large",
          "This project is too large for the prototype.",
        );
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RoomError(400, "invalid_json", "Send a valid JSON request.");
  }
}
export function roomFailure(error: unknown) {
  if (error instanceof RoomError)
    return Response.json(
      { code: error.code, error: error.message },
      { status: error.status, headers: privateHeaders },
    );
  if (error instanceof z.ZodError)
    return Response.json(
      {
        code: "invalid_input",
        error:
          "Check the contribution: " +
          error.issues
            .map((i) => i.message)
            .slice(0, 3)
            .join("; "),
      },
      { status: 400, headers: privateHeaders },
    );
  return Response.json(
    {
      code: "storage_unavailable",
      error:
        "Shared storage is unavailable. Your local workspace is unchanged. Retry later or continue locally.",
    },
    { status: 503, headers: privateHeaders },
  );
}
export function validRoomId(id: string) {
  if (!/^[a-f0-9]{24}$/.test(id))
    throw new RoomError(
      404,
      "room_not_found",
      "Room not found. Check the invitation.",
    );
}
