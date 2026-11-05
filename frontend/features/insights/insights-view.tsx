"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status-pill";
import { apiFetch } from "@/lib/api/client";

interface Indicator { code: string; text: string }
export interface AtRisk {
  student_id: string; roll_number: string; full_name: string; category: string; confidence: string;
  indicators: Indicator[]; attendance_pct: string | null; internals_score: string | null; internals_max: string | null; rule_version: string;
}
interface Assessment extends Omit<AtRisk, "roll_number" | "full_name"> {
  id?: string | null;
  explanation: string | null; explanation_status: string; explanation_note: string; persisted: boolean; created_at: string | null;
}
interface Task { id: string; student_id: string; title: string; notes: string | null; status: string; due_on: string | null }

/** Backend categories: on_track | watch | at_risk; confidence: sufficient | limited | insufficient. */
export function riskLabel(category: string, confidence: string): string {
  if (confidence === "insufficient") return "Insufficient data";
  return ({ at_risk: "High", watch: "Moderate", on_track: "Low" } as Record<string, string>)[category] ?? category;
}
export function riskTone(category: string, confidence: string): "danger" | "warning" | "positive" | "neutral" {
  if (confidence === "insufficient") return "neutral";
  return ({ at_risk: "danger", watch: "warning", on_track: "positive" } as Record<string, "danger" | "warning" | "positive">)[category] ?? "neutral";
}

export function InsightsView() {
  const q = useQuery({ queryKey: ["at-risk"], queryFn: ({ signal }) => apiFetch<AtRisk[]>("/api/v1/insights/at-risk", { signal }) });
  const [selected, setSelected] = useState<AtRisk | null>(null);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Student insights</h1>
        <p className="text-sm text-muted">Risk is decided by documented rules. Any AI text only explains the evidence shown.</p>
      </header>
      {q.isPending && <Skeleton className="h-40" />}
      {q.isError && <ErrorState title="Couldn't load insights" message={q.error.message} onRetry={() => q.refetch()} />}
      {q.data && q.data.length === 0 && <EmptyState title="No students need attention" body="Nobody is flagged by the current rules. All caught up." />}
      {q.data && q.data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul aria-label="Students to review" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {q.data.map((r) => (
              <li key={r.student_id}>
                <button type="button" onClick={() => setSelected(r)} aria-pressed={selected?.student_id === r.student_id}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-canvas aria-pressed:bg-canvas">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{r.full_name}</span>
                    <span className="tabular block text-xs text-muted">{r.roll_number} · {r.attendance_pct != null ? `${r.attendance_pct}% attendance` : "no attendance yet"}</span>
                  </span>
                  <StatusPill tone={riskTone(r.category, r.confidence)}>{riskLabel(r.category, r.confidence)} risk</StatusPill>
                </button>
              </li>
            ))}
          </ul>
          <div>{selected ? <StudentPanel key={selected.student_id} row={selected} /> : <p className="text-sm text-muted">Select a student to see the evidence.</p>}</div>
        </div>
      )}
      <TaskList />
    </div>
  );
}

function StudentPanel({ row }: { row: AtRisk }) {
  const qc = useQueryClient();
  const a = useQuery({
    queryKey: ["insight", row.student_id],
    queryFn: ({ signal }) => apiFetch<Assessment>(`/api/v1/insights/students/${row.student_id}`, { signal }),
  });
  const rerun = useMutation({
    mutationFn: () => apiFetch<Assessment>(`/api/v1/insights/students/${row.student_id}/assess`, { method: "POST" }),
    onSuccess: (d) => {
      qc.setQueryData(["insight", row.student_id], d);
      void qc.invalidateQueries({ queryKey: ["insight-history", row.student_id] });
    },
  });
  const history = useQuery({
    queryKey: ["insight-history", row.student_id],
    queryFn: ({ signal }) => apiFetch<Assessment[]>(`/api/v1/insights/students/${row.student_id}/history`, { signal }),
  });
  const data = rerun.data ?? a.data;
  const [creating, setCreating] = useState(false);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{row.full_name}</h2>
          <p className="tabular text-xs text-muted">{row.roll_number}</p>
        </div>
        <StatusPill tone={riskTone((data ?? row).category, (data ?? row).confidence)}>{riskLabel((data ?? row).category, (data ?? row).confidence)} risk</StatusPill>
      </div>
      {a.isPending && <Skeleton className="h-24" />}
      {a.isError && <ErrorState title="Couldn't load evidence" message={a.error.message} onRetry={() => a.refetch()} />}
      {data && (
        <>
          <section aria-label="Evidence">
            <h3 className="text-sm font-bold">Evidence (rules {data.rule_version})</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {data.indicators.length === 0 && <li className="text-muted">No indicators raised.</li>}
              {data.indicators.map((i) => <li key={i.code}>{i.text}</li>)}
            </ul>
            <p className="tabular mt-2 text-xs text-muted">
              Attendance {data.attendance_pct ?? "n/a"}% · Internals {data.internals_score ?? "n/a"}/{data.internals_max ?? "n/a"}
              {data.created_at && ` · calculated ${new Date(data.created_at).toLocaleString("en-IN")}`}
            </p>
          </section>
          <section aria-label="Explanation">
            <h3 className="text-sm font-bold">Explanation</h3>
            {data.explanation ? (
              <p className="mt-1 text-sm">{data.explanation} <span className="text-xs text-muted">(AI-generated from the evidence above)</span></p>
            ) : (
              <p className="mt-1 text-sm text-muted">{data.explanation_note}</p>
            )}
          </section>
        </>
      )}
      {history.data && history.data.length > 0 && (
        <section aria-label="Trend">
          <h3 className="text-sm font-bold">Past calculations</h3>
          <ul className="tabular mt-1 space-y-1 text-xs text-muted">
            {history.data.slice(0, 5).map((h, idx) => (
              <li key={h.id ?? idx}>
                {h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN") : "—"} · {riskLabel(h.category, h.confidence)} · attendance {h.attendance_pct ?? "n/a"}% · internals {h.internals_score ?? "n/a"}/{h.internals_max ?? "n/a"}
              </li>
            ))}
          </ul>
        </section>
      )}
      {rerun.error && <p role="alert" className="text-sm text-danger-fg">{rerun.error.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={rerun.isPending} onClick={() => rerun.mutate()}>Recalculate and save</Button>
        <Button onClick={() => setCreating((v) => !v)} aria-expanded={creating}>Create mentor task</Button>
      </div>
      {creating && <TaskForm row={row} onDone={() => setCreating(false)} />}
    </Card>
  );
}

/** Human approval step: nothing is created until the admin reviews and presses the button. */
function TaskForm({ row, onDone }: { row: AtRisk; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: `Follow up with ${row.full_name}`, notes: row.indicators.map((i) => i.text).join(" "), due_on: "" });
  const m = useMutation({
    mutationFn: () => apiFetch("/api/v1/mentor-tasks", { method: "POST", body: { student_id: row.student_id, title: f.title, notes: f.notes || null, due_on: f.due_on || null } }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["mentor-tasks"] }); onDone(); },
  });
  return (
    <form aria-label="New mentor task" className="space-y-3 border-t border-line pt-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <p className="text-xs text-muted">Review the suggested text, edit it if needed, then approve. Nothing is created until you do.</p>
      <Field label="Task" required maxLength={160} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <label className="block text-sm font-medium">Notes
        <textarea maxLength={2000} rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })}
          className="mt-1.5 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-base font-normal lg:text-sm" />
      </label>
      <Field label="Due date" type="date" value={f.due_on} onChange={(e) => setF({ ...f, due_on: e.target.value })} />
      {m.error && <p role="alert" className="text-sm text-danger-fg">{m.error.message}</p>}
      <Button type="submit" variant="accent" loading={m.isPending}>Approve and create task</Button>
    </form>
  );
}

function TaskList() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["mentor-tasks"], queryFn: ({ signal }) => apiFetch<Task[]>("/api/v1/mentor-tasks", { signal }) });
  const upd = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/api/v1/mentor-tasks/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentor-tasks"] }),
  });
  if (q.isPending || q.isError) return q.isError ? <ErrorState title="Couldn't load mentor tasks" message={q.error.message} onRetry={() => q.refetch()} /> : null;
  return (
    <section aria-label="Mentor tasks" className="space-y-2">
      <h2 className="text-xl font-bold">Mentor tasks</h2>
      {q.data.length === 0 && <p className="text-sm text-muted">No mentor tasks yet.</p>}
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {q.data.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
            <span className="min-w-0"><b>{t.title}</b>{t.due_on && <span className="tabular text-muted"> · due {t.due_on}</span>}</span>
            <span className="flex items-center gap-2">
              <StatusPill tone={t.status === "completed" ? "positive" : t.status === "cancelled" ? "neutral" : "warning"}>{t.status.replace("_", " ")}</StatusPill>
              {(t.status === "open" || t.status === "in_progress") && (
                <>
                  {t.status === "open" && <Button variant="secondary" loading={upd.isPending} onClick={() => upd.mutate({ id: t.id, status: "in_progress" })}>Start</Button>}
                  <Button variant="secondary" loading={upd.isPending} onClick={() => upd.mutate({ id: t.id, status: "completed" })}>Complete</Button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {upd.error && <p role="alert" className="text-sm text-danger-fg">{upd.error.message}</p>}
    </section>
  );
}
