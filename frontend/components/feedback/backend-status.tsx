"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

type Ready = { status: string; database: string };

/** Real connectivity indicator: shows the result of an actual request to the FastAPI /ready endpoint. */
export function BackendStatus() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["backend", "ready"],
    queryFn: ({ signal }) => apiFetch<Ready>("/ready", { signal }),
    refetchInterval: 30_000,
    retry: false,
  });

  let label = "Checking server…";
  let tone = "bg-warning-bg text-warning-fg";
  if (!isPending && isError) {
    label = "Server unreachable";
    tone = "bg-danger-bg text-danger-fg";
  } else if (data) {
    const dbNote =
      data.database === "ok" ? "database connected" : data.database === "not_configured" ? "database not configured" : "database unavailable";
    label = `Server online · ${dbNote}`;
    tone = data.database === "ok" ? "bg-positive-bg text-positive-fg" : "bg-warning-bg text-warning-fg";
  }

  return (
    <button
      type="button"
      onClick={() => refetch()}
      aria-live="polite"
      title="Click to re-check"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-opacity",
        tone,
        isFetching && "opacity-70",
      )}
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      {label}
    </button>
  );
}
