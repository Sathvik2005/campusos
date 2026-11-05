"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="text-muted">The page failed to load. Your data has not been changed. You can try again.</p>
      <button
        type="button"
        onClick={reset}
        className="min-h-11 rounded-[var(--radius-control)] bg-ink px-5 text-sm font-semibold text-on-dark"
      >
        Try again
      </button>
    </main>
  );
}
