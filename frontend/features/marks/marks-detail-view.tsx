"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@/features/auth/auth-provider";
import { apiFetch } from "@/lib/api/client";
import type { Page, StudentRow } from "@/types/api";
import { LIFECYCLE_TONE, type Component } from "./marks-view";

interface Detail extends Component { scores: { student_id: string; score: string }[] }
interface AuditRow { id: string; student_id: string | null; old_score: string | null; new_score: string | null; from_lifecycle: string | null; to_lifecycle: string | null; reason: string | null; created_at: string }

/** Client-side mirror of the server rules, so errors show inline before a round trip. */
export function validateScore(raw: string, max: number): string | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Enter a number";
  if (n < 0) return "Cannot be negative";
  if (n > max) return `Max is ${max}`;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return "At most 2 decimals";
  return null;
}

export function MarksDetailView({ id }: { id: string }) {
  const { state } = useAuth();
  const role = state.status === "authenticated" ? state.user.role : null;
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: ["component", id], queryFn: ({ signal }) => apiFetch<Detail>(`/api/v1/assessments/${id}`, { signal }) });
  const c = detail.data;
  const students = useQuery({
    queryKey: ["class-students", c?.batch_id],
    enabled: !!c,
    queryFn: ({ signal }) => apiFetch<Page<StudentRow>>(`/api/v1/students?batch_id=${c!.batch_id}&status=active&page_size=100`, { signal }),
  });
  const audit = useQuery({ queryKey: ["component-audit", id], queryFn: ({ signal }) => apiFetch<AuditRow[]>(`/api/v1/assessments/${id}/audit`, { signal }) });

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const max = c ? Number(c.max_marks) : 0;
  const saved = useMemo(() => Object.fromEntries((c?.scores ?? []).map((s) => [s.student_id, s.score])), [c]);
  const value = (sid: string) => draft[sid] ?? (saved[sid] ?? "");
  const errors = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, validateScore(v, max)]));
  const hasErrors = Object.values(errors).some(Boolean);

  const editable = !!c && ((role === "faculty" && c.lifecycle === "draft") || (role === "office_admin" && (c.lifecycle === "submitted" || c.lifecycle === "moderated")));
  const needsReason = role === "office_admin";
  const refresh = () => Promise.all(["component", "component-audit", "components"].map((k) => qc.invalidateQueries({ queryKey: k === "components" ? [k] : [k, id] })));

  const act = useMutation({
    mutationFn: ({ path, body, method = "POST" }: { path: string; body?: unknown; method?: "POST" | "PUT" }) => apiFetch(path, { method, body }),
    onSuccess: async () => { setDraft({}); setReason(""); await refresh(); },
  });
  const saveScores = () =>
    act.mutate({
      path: `/api/v1/assessments/${id}/scores`, method: "PUT",
      body: { scores: Object.entries(draft).filter(([, v]) => v.trim() !== "").map(([student_id, score]) => ({ student_id, score })), ...(needsReason ? { reason } : {}) },
    });
  const lifecycleAction = (path: string, body?: unknown) => act.mutate({ path, body });

  if (detail.isPending) return <Skeleton className="h-48" />;
  if (detail.isError) return <ErrorState title="Couldn't load this assessment" message={detail.error.message} onRetry={() => detail.refetch()} />;
  const rows = students.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Link href="/marks" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-strong">← All assessments</Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{c!.name}</h1>
        <StatusPill tone={LIFECYCLE_TONE[c!.lifecycle]}>{c!.lifecycle[0].toUpperCase() + c!.lifecycle.slice(1)}</StatusPill>
        <span className="tabular text-sm text-muted">Max {c!.max_marks}</span>
      </header>
      {c!.lifecycle === "locked" && (
        <p role="status" className="rounded-[var(--radius-control)] bg-positive-bg px-4 py-3 text-sm font-medium text-positive-fg">
          Locked. Scores are final until an Office Admin unlocks them with a reason.
        </p>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full text-sm">
          <caption className="sr-only">Scores out of {c!.max_marks}</caption>
          <thead className="bg-canvas text-left text-xs text-muted">
            <tr><th className="px-4 py-2">Student</th><th className="px-4 py-2 text-right">Score / {c!.max_marks}</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2"><span className="block font-medium">{s.full_name}</span><span className="tabular text-xs text-muted">{s.roll_number}</span></td>
                <td className="px-4 py-2 text-right">
                  {editable ? (
                    <>
                      <input
                        aria-label={`Score for ${s.full_name}`} inputMode="decimal" value={value(s.id)}
                        onChange={(e) => setDraft({ ...draft, [s.id]: e.target.value })}
                        aria-invalid={errors[s.id] ? true : undefined}
                        className={`tabular min-h-11 w-24 rounded-[var(--radius-control)] border bg-surface px-3 text-right text-base lg:min-h-9 lg:text-sm ${errors[s.id] ? "border-danger-fg" : "border-line"}`}
                      />
                      {errors[s.id] && <p role="alert" className="text-xs text-danger-fg">{errors[s.id]}</p>}
                    </>
                  ) : (
                    <span className="tabular font-semibold">{saved[s.id] ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && needsReason && (
        <label className="block text-sm font-medium">Reason for change (required)
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base font-normal lg:min-h-10 lg:text-sm" />
        </label>
      )}
      {act.error && <p role="alert" className="text-sm text-danger-fg">{act.error.message}</p>}

      <div className="flex flex-wrap gap-2">
        {editable && <Button loading={act.isPending} disabled={hasErrors || Object.keys(draft).length === 0 || (needsReason && !reason.trim())} onClick={saveScores}>Save scores</Button>}
        {role === "faculty" && c!.lifecycle === "draft" && <Button variant="accent" loading={act.isPending} disabled={Object.keys(draft).length > 0} onClick={() => lifecycleAction(`/api/v1/assessments/${id}/submit`)}>Submit for moderation</Button>}
        {role === "office_admin" && c!.lifecycle === "submitted" && <Button loading={act.isPending} onClick={() => lifecycleAction(`/api/v1/moderation/${id}/moderate`)}>Mark moderated</Button>}
        {role === "office_admin" && c!.lifecycle === "moderated" && <Button loading={act.isPending} onClick={() => lifecycleAction(`/api/v1/moderation/${id}/lock`)}>Lock marks</Button>}
        {role === "office_admin" && c!.lifecycle !== "draft" && c!.lifecycle !== "submitted" && c!.lifecycle !== "moderated" && (
          <Button variant="destructive" loading={act.isPending} disabled={!reason.trim()} onClick={() => lifecycleAction(`/api/v1/moderation/${id}/unlock`, { reason })}>Unlock (reason required)</Button>
        )}
      </div>
      {role === "office_admin" && c!.lifecycle === "locked" && (
        <label className="block text-sm font-medium">Unlock reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base font-normal lg:min-h-10 lg:text-sm" />
        </label>
      )}

      <section aria-label="Change history" className="space-y-2">
        <h2 className="text-lg font-bold">History</h2>
        {audit.data && audit.data.length === 0 && <p className="text-sm text-muted">No changes recorded yet.</p>}
        <ul className="space-y-1 text-sm">
          {audit.data?.map((a) => (
            <li key={a.id} className="tabular text-muted">
              {new Date(a.created_at).toLocaleString("en-IN")} ·{" "}
              {a.to_lifecycle ? `${a.from_lifecycle ?? "—"} → ${a.to_lifecycle}` : `score ${a.old_score ?? "—"} → ${a.new_score ?? "—"}`}
              {a.reason ? ` · ${a.reason}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
