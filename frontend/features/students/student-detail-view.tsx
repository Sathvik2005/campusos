"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/states";
import { Card, Skeleton } from "@/components/ui/card";
import { ApiError, apiFetch } from "@/lib/api/client";
import { formatInr } from "@/lib/utils/format";
import type { StudentDetail } from "@/types/api";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="space-y-1">
      <p className="text-sm text-muted">{label}</p>
      <p className="tabular text-2xl font-extrabold">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </Card>
  );
}

export function StudentDetailView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["student", id],
    queryFn: ({ signal }) => apiFetch<StudentDetail>(`/api/v1/students/${id}`, { signal }),
    retry: false,
  });
  const s = q.data;
  return (
    <div className="space-y-6">
      <Link href="/students" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-strong">← All students</Link>
      {q.isPending && <Skeleton className="h-32" />}
      {q.isError && (
        <ErrorState
          title={q.error instanceof ApiError && q.error.status === 404 ? "Student not found" : "Couldn't load this student"}
          message={q.error.message}
          onRetry={() => q.refetch()}
        />
      )}
      {s && (
        <>
          <header>
            <h1 className="text-3xl font-extrabold lg:text-4xl">{s.full_name}</h1>
            <p className="tabular text-sm text-muted">{s.roll_number} · Year {s.year_of_study}</p>
          </header>
          <section aria-label="Academic summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Attendance" value={s.attendance_pct != null ? `${s.attendance_pct}%` : "No data"} />
            <Stat
              label="Internals"
              value={s.internals_score != null && s.internals_max != null ? `${s.internals_score}/${s.internals_max}` : "No data"}
              note="Locked marks only"
            />
            {s.fees && <Stat label="Fee due" value={formatInr(s.fees.outstanding)} note="Simulated ledger" />}
          </section>
        </>
      )}
    </div>
  );
}
