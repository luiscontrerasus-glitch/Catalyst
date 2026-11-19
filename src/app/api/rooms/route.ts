import { roomStore } from "@/rooms/runtime.server";
import {
  roomBody,
  roomFailure,
  privateHeaders,
  sessionCookie,
} from "@/rooms/http.server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const result = await (await roomStore()).create(await roomBody(request));
    return Response.json(
      { room: result.room, invite: result.invite },
      {
        status: 201,
        headers: {
          ...privateHeaders,
          "Set-Cookie": sessionCookie(request, result.room.id, result.token),
        },
      },
    );
  } catch (error) {
    return roomFailure(error);
  }
}
