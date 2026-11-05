"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@/features/auth/auth-provider";
import { apiFetch } from "@/lib/api/client";
import type { Batch, Subject } from "@/types/api";

export interface Component {
  id: string; subject_id: string; batch_id: string; name: string; max_marks: string;
  lifecycle: "draft" | "submitted" | "moderated" | "locked"; submitted_at: string | null; locked_at: string | null;
}

export const LIFECYCLE_TONE = { draft: "neutral", submitted: "warning", moderated: "warning", locked: "positive" } as const;
const selectCls = "min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base lg:min-h-10 lg:text-sm";

function useRefs() {
  const batches = useQuery({ queryKey: ["batches"], queryFn: ({ signal }) => apiFetch<Batch[]>("/api/v1/academic/batches", { signal }) });
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: ({ signal }) => apiFetch<Subject[]>("/api/v1/academic/subjects", { signal }) });
  return { batches: batches.data, subjects: subjects.data };
}

export function MarksView() {
  const { state } = useAuth();
  const isAdmin = state.status === "authenticated" && state.user.role === "office_admin";
  const { batches, subjects } = useRefs();
  const list = useQuery({ queryKey: ["components"], queryFn: ({ signal }) => apiFetch<Component[]>("/api/v1/marks/assessments", { signal }) });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Internal marks</h1>
        <p className="text-sm text-muted">Enter, submit, moderate and lock internal assessments.</p>
      </header>
      {list.isPending && <Skeleton className="h-40" />}
      {list.isError && <ErrorState title="Couldn't load assessments" message={list.error.message} onRetry={() => list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState mascot={false} title="No assessments yet" body={isAdmin ? "Create the first internal assessment below." : "Assessments appear once the office creates them for your classes."} />}
      {list.data && list.data.length > 0 && (
        <ul aria-label="Assessments" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {list.data.map((c) => {
            const b = batches?.find((x) => x.id === c.batch_id);
            return (
              <li key={c.id}>
                <Link href={`/marks/${c.id}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 hover:bg-canvas">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.name} · {subjects?.find((x) => x.id === c.subject_id)?.name ?? "Subject"}</span>
                    <span className="tabular block text-xs text-muted">Year {b?.year_of_study} {b?.section} · max {c.max_marks}</span>
                  </span>
                  <StatusPill tone={LIFECYCLE_TONE[c.lifecycle]}>{c.lifecycle[0].toUpperCase() + c.lifecycle.slice(1)}</StatusPill>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {isAdmin && batches && subjects && <CreateComponent batches={batches} subjects={subjects} />}
    </div>
  );
}

function CreateComponent({ batches, subjects }: { batches: Batch[]; subjects: Subject[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ subject_id: "", batch_id: "", name: "", max_marks: "" });
  const m = useMutation({
    mutationFn: () => apiFetch("/api/v1/marks/assessments", { method: "POST", body: { ...f, max_marks: f.max_marks } }),
    onSuccess: () => { setF({ subject_id: "", batch_id: "", name: "", max_marks: "" }); return qc.invalidateQueries({ queryKey: ["components"] }); },
  });
  return (
    <Card>
      <form aria-label="Create assessment" className="space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <h2 className="font-bold">Create assessment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">Subject
            <select required value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value })} className={`${selectCls} mt-1.5 font-normal`}>
              <option value="">Select…</option>
              {subjects.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Class
            <select required value={f.batch_id} onChange={(e) => setF({ ...f, batch_id: e.target.value })} className={`${selectCls} mt-1.5 font-normal`}>
              <option value="">Select…</option>
              {batches.filter((b) => b.is_active).map((b) => <option key={b.id} value={b.id}>{`Year ${b.year_of_study} · ${b.section}`}</option>)}
            </select>
          </label>
          <Field label="Name" placeholder="Internal 1" required maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Field label="Maximum marks" type="number" step="0.01" min="0.01" required value={f.max_marks} onChange={(e) => setF({ ...f, max_marks: e.target.value })} />
        </div>
        {m.error && <p role="alert" className="text-sm text-danger-fg">{m.error.message}</p>}
        <Button type="submit" loading={m.isPending}>Create assessment</Button>
      </form>
    </Card>
  );
}
