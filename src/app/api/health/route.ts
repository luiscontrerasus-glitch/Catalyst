import { roomStore } from "@/rooms/runtime.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await roomStore().ready();
    return Response.json(
      {
        status: "ok",
        rooms: process.env.TURSO_DATABASE_URL ? "managed" : "local",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "rooms-unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
