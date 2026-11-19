import SharedRoom from "@/components/shared-room";
export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SharedRoom id={id} />;
}
