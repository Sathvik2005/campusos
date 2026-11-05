"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/feedback/states";
import { Card, Skeleton } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError, apiFetch } from "@/lib/api/client";
import { formatInr } from "@/lib/utils/format";
import type { Overview } from "@/types/api";

function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="space-y-1">
      <p className="text-sm text-muted">{label}</p>
      <p className="tabular text-3xl font-extrabold tracking-tight">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </Card>
  );
}

/** Overview: every number comes from GET /api/v1/overview (real rows, role-shaped). */
export function OverviewView() {
  const { state } = useAuth();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["overview"],
    queryFn: ({ signal }) => apiFetch<Overview>("/api/v1/overview", { signal }),
  });
  const name = state.status === "authenticated" ? state.user.display_name.split(" ")[0] : "";
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">{date}</p>
        <h1 className="text-3xl font-extrabold lg:text-4xl">
          {greeting()}
          {name ? `, ${name}.` : "."}
        </h1>
      </header>

      {isPending && (
        <div role="status" aria-label="Loading overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState
          title={error instanceof ApiError && error.status === 403 ? "Not allowed" : "Couldn't load the overview"}
          message={error instanceof Error ? error.message : "Unknown error"}
          onRetry={() => refetch()}
        />
      )}
      {data?.role === "office_admin" && (
        <section aria-label="Campus summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Active students" value={String(data.active_students)} />
          <Metric label="Attendance below 75%" value={String(data.students_below_75_attendance)} note="Official, synced records" />
          <Metric label="Outstanding dues" value={formatInr(data.outstanding_dues)} note="Simulated ledger" />
          <Metric label="Students to review" value={String(data.students_to_review)} note={`${data.open_mentor_tasks} open mentor tasks`} />
        </section>
      )}
      {data?.role === "faculty" && (
        <section aria-label="Your classes" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Assigned classes" value={String(data.assigned_classes)} />
          <Metric label="Sessions recorded" value={String(data.sessions_recorded)} />
        </section>
      )}
    </div>
  );
}
