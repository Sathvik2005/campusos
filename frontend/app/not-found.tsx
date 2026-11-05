import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-extrabold">Page not found</h1>
      <p className="text-muted">That page does not exist.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-ink px-5 text-sm font-semibold text-on-dark">
        Back to Overview
      </Link>
    </main>
  );
}
