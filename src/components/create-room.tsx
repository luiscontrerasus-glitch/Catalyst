"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Modal } from "./dialog";
import type { Project } from "@/engine/model";
export function CreateRoomDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("Fictional organizer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function create() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, project }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Could not create a room.");
      const href = `${window.location.origin}/rooms/${data.room.id}`;
      try {
        sessionStorage.setItem(
          `catalyst:invite:${data.room.id}`,
          `${href}#invite=${data.invite}`,
        );
      } catch {}
      router.push(`/rooms/${data.room.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The room could not be created.",
      );
      setBusy(false);
    }
  }
  return (
    <Modal title="Bring the right people together." onClose={onClose}>
      <p className="modal-intro">
        Create a durable shared copy of this approved project. Your local
        project stays available. Invited people can contribute their own
        availability and existing supplies; only you can change the plan’s
        requirements.
      </p>
      <form
        className="volunteer-form"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label>
          Your display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </label>
        <p className="editor-note">
          Use fictional names for the hackathon demo. No email or account is
          needed. Room invitations grant access; share only with intended
          participants.
        </p>
        {error && (
          <p className="editor-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={busy || !name.trim()}
          type="submit"
        >
          <Users size={17} />
          {busy ? "Creating room…" : "Create shared room"}
        </button>
      </form>
    </Modal>
  );
}
