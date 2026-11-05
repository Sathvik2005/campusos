export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto max-w-[1200px] animate-pulse space-y-4 p-8">
      <div className="h-8 w-48 rounded-[var(--radius-control)] bg-line" />
      <div className="h-40 rounded-[var(--radius-card)] bg-line" />
    </div>
  );
}
