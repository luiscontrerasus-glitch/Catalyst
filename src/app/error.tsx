"use client";
import Link from "next/link";
import { Brand } from "@/components/brand";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="error-page" role="alert">
      <Brand href="/" />
      <div className="error-panel">
        <p className="eyebrow">CATALYST WORKSPACE</p>
        <h1>This view could not load.</h1>
        <p>
          Try again. If the problem continues, return to your workspace.
          Unapproved edits may need to be entered again.
        </p>
        <div className="hero-actions">
          <button className="button primary" onClick={() => retry()}>
            Try again
          </button>
          <Link className="button secondary" href="/">
            Return to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
