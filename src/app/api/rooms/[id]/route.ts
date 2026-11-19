import { roomStore } from "@/rooms/runtime.server";
import {
  roomBody,
  roomFailure,
  privateHeaders,
  roomToken,
  validRoomId,
} from "@/rooms/http.server";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    validRoomId(id);
    const etag = request.headers
      .get("if-none-match")
      ?.match(/^"room-(\d+)"$/)?.[1];
    const room = await roomStore().read(
      id,
      roomToken(request, id),
      etag ? Number(etag) : undefined,
    );
    if (!room)
      return new Response(null, { status: 304, headers: privateHeaders });
    return Response.json(
      { room },
      { headers: { ...privateHeaders, ETag: `"room-${room.revision}"` } },
    );
  } catch (error) {
    return roomFailure(error);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    validRoomId(id);
    const result = await roomStore().mutate(
      id,
      roomToken(request, id),
      await roomBody(request),
    );
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    return roomFailure(error);
  }
}
