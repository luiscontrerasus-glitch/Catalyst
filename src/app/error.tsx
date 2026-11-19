'use client';
import Link from 'next/link';

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <main className="mx-auto max-w-xl p-8" role="alert">
    <h1 className="text-2xl font-semibold">This view could not load.</h1>
    <p className="my-4">Try again. If the problem continues, return to your workspace. Unapproved edits may need to be entered again.</p>
    <button className="rounded border px-4 py-2" onClick={() => retry()}>Try again</button>
    <Link className="ml-4 underline" href="/">Return to workspace</Link>
  </main>;
}
