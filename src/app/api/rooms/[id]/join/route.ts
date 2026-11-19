import { roomStore } from "@/rooms/runtime.server";
import {
  roomBody,
  roomFailure,
  privateHeaders,
  roomToken,
  sessionCookie,
  validRoomId,
} from "@/rooms/http.server";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    validRoomId(id);
    const result = await roomStore().join(
      id,
      await roomBody(request),
      roomToken(request, id),
    );
    return Response.json(
      { room: result.room },
      {
        headers: {
          ...privateHeaders,
          "Set-Cookie": sessionCookie(request, id, result.token),
        },
      },
    );
  } catch (error) {
    return roomFailure(error);
  }
}
