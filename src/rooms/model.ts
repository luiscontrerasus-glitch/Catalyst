import { z } from "zod";
import { projectSchema, volunteerSchema, type Project } from "@/engine/model";
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a display name.")
  .max(40, "Use at most 40 characters.");
export const createRoomSchema = z
  .object({ name: displayNameSchema, project: projectSchema })
  .strict();
export const joinRoomSchema = z
  .object({
    name: displayNameSchema,
    invite: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const contributionSchema = volunteerSchema
  .omit({ id: true, name: true, simulated: true, simulatedAvailability: true })
  .strict();
export const roomActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("replace"), project: projectSchema }).strict(),
  z
    .object({ kind: z.literal("volunteer"), profile: contributionSchema })
    .strict(),
  z.object({ kind: z.literal("withdraw") }).strict(),
  z
    .object({
      kind: z.literal("stock"),
      resourceId: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(10000),
    })
    .strict(),
  z.object({ kind: z.literal("rotate-invite") }).strict(),
]);
export const mutationSchema = z
  .object({
    baseRevision: z.number().int().positive(),
    requestId: z.string().uuid(),
    action: roomActionSchema,
  })
  .strict();
export type RoomAction = z.infer<typeof roomActionSchema>;
export type RoomMutation = z.infer<typeof mutationSchema>;
export type Member = {
  id: string;
  name: string;
  role: "owner" | "contributor";
};
export type RoomView = {
  id: string;
  project: Project;
  revision: number;
  self: Member & { volunteerId: string };
  members: Member[];
  activity: {
    id: string;
    actor: string;
    summary: string;
    revision: number;
    at: string;
  }[];
  storage: "local" | "managed";
};
export class RoomError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
