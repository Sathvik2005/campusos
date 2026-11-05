"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@/features/auth/auth-provider";
import { useSync } from "@/features/offline/sync-provider";
import { NetworkError, apiFetch } from "@/lib/api/client";
import { cachedFetch } from "@/lib/offline/cache";
import type { OutboxItem } from "@/lib/offline/db";
import { buildSyncPayload, enqueue, listOutbox, requeue } from "@/lib/offline/outbox";
import { cn } from "@/lib/utils/cn";
import type { Assignment, Batch, Subject } from "@/types/api";

export type Mark = "present" | "absent" | "late";
interface Roster { batch_id: string; subject_id: string; students: { id: string; roll_number: string; full_name: string }[] }
interface SessionRow { id: string; batch_id: string; subject_id: string; held_on: string; period: number }

const selectCls = "min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base lg:min-h-10 lg:text-sm";
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export { buildSyncPayload };

const LABEL: Record<Mark, string> = { present: "Present", absent: "Absent", late: "Late" };
const TONE: Record<Mark, string> = {
  present: "border-positive-fg bg-positive-bg text-positive-fg",
  absent: "border-danger-fg bg-danger-bg text-danger-fg",
  late: "border-warning-fg bg-warning-bg text-warning-fg",
};

export function AttendanceView() {
  const { state } = useAuth();
  const isFaculty = state.status === "authenticated" && state.user.role === "faculty";
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Attendance</h1>
        <p className="text-sm text-muted">{isFaculty ? "Pick a class, mark everyone, save." : "Recorded sessions across the campus."}</p>
      </header>
      {isFaculty ? <TakeAttendance /> : <SessionsList />}
    </div>
  );
}

function TakeAttendance() {
  const { state } = useAuth();
  const profileId = state.status === "authenticated" ? state.user.id : "";
  const { items, syncNow } = useSync();
  const assignments = useCachedList<Assignment>(profileId, "assignments", "/api/v1/academic/assignments");
  const batches = useCachedList<Batch>(profileId, "batches", "/api/v1/academic/batches");
  const subjects = useCachedList<Subject>(profileId, "subjects", "/api/v1/academic/subjects");
  const [pair, setPair] = useState(""); // `${batch_id}|${subject_id}`
  const [heldOn, setHeldOn] = useState(today);
  const [period, setPeriod] = useState(1);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [saved, setSaved] = useState<{ synced: boolean; count: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchId, subjectId] = pair.split("|");

  const roster = useQuery({
    queryKey: ["roster", profileId, batchId, subjectId],
    enabled: !!pair && !!profileId,
    retry: false,
    queryFn: ({ signal }) =>
      cachedFetch(profileId, `roster:${batchId}:${subjectId}`, () => apiFetch<Roster>(`/api/v1/attendance/roster?batch_id=${batchId}&subject_id=${subjectId}`, { signal })),
  });
  const students = roster.data?.data.students ?? [];
  const unmarked = students.filter((s) => !marks[s.id]).length;
  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0 };
    Object.values(marks).forEach((m) => c[m]++);
    return c;
  }, [marks]);

  const label = () => {
    const b = batches.data?.data.find((x) => x.id === batchId);
    return `${subjects.data?.data.find((x) => x.id === subjectId)?.name ?? "Subject"} · Year ${b?.year_of_study ?? "?"} ${b?.section ?? ""} · ${heldOn} P${period}`;
  };

  /** IndexedDB first, then try the network. A failed or offline sync never loses the marks. */
  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildSyncPayload({ key: crypto.randomUUID(), batchId, subjectId, heldOn, period, marks });
      await enqueue(profileId, payload, label());
      setMarks({});
      setSaved({ synced: false, count: payload.records.length });
      await syncNow(true);
      const now = (await listOutbox(profileId)).find((i) => i.id === payload.idempotency_key);
      setSaved({ synced: now?.status === "synced", count: payload.records.length });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save on this device.");
    } finally {
      setSaving(false);
    }
  };

  const pairs = (assignments.data?.data ?? []).map((a) => {
    const b = batches.data?.data.find((x) => x.id === a.batch_id);
    const s = subjects.data?.data.find((x) => x.id === a.subject_id);
    return { value: `${a.batch_id}|${a.subject_id}`, label: `${s?.name ?? "Subject"} · Year ${b?.year_of_study ?? "?"} ${b?.section ?? ""}` };
  });

  if (assignments.isPending || batches.isPending || subjects.isPending) return <Skeleton className="h-40" />;
  const failed = [assignments, batches, subjects].find((q) => q.isError);
  if (failed) {
    const offline = failed.error instanceof NetworkError;
    return (
      <>
        <ErrorState
          title={offline ? "You're offline and your classes aren't saved on this device yet" : "Couldn't load your classes"}
          message={offline ? "Open Attendance once while online so your classes and rosters are saved for offline use." : failed.error!.message}
          onRetry={() => failed.refetch()}
        />
        <LocalSessions items={items} onRetry={() => syncNow(true)} />
      </>
    );
  }
  if (!pairs.length) return <EmptyState title="No classes assigned yet" body="Ask the office admin to assign you a subject and class." />;

  return (
    <div className="space-y-5 pb-44 lg:pb-28">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium sm:col-span-1">
          Class and subject
          <select value={pair} onChange={(e) => { setPair(e.target.value); setMarks({}); setSaved(null); }} className={`${selectCls} mt-1.5 font-normal`}>
            <option value="">Select…</option>
            {pairs.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Date
          <input type="date" max={today()} value={heldOn} onChange={(e) => setHeldOn(e.target.value)} className={`${selectCls} mt-1.5 font-normal`} />
        </label>
        <label className="block text-sm font-medium">
          Period
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className={`${selectCls} mt-1.5 font-normal`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {saved && (
        <p role="status" className="rounded-[var(--radius-control)] bg-positive-bg px-4 py-3 text-sm font-medium text-positive-fg">
          {saved.synced ? `Saved and synced ${saved.count} records. All caught up. Nice work.` : `Saved ${saved.count} records on this device. They will sync when you are back online.`}
        </p>
      )}
      {roster.data?.fromCache && (
        <p role="note" className="rounded-[var(--radius-control)] bg-warning-bg px-4 py-2 text-sm text-warning-fg">
          Using the roster saved on this device{roster.data.cachedAt ? ` (${new Date(roster.data.cachedAt).toLocaleString("en-IN")})` : ""}. The server will re-check everything when this syncs.
        </p>
      )}
      {pair && roster.isPending && <div role="status" aria-label="Loading roster" className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
      {roster.isError && (
        <ErrorState
          title={roster.error instanceof NetworkError ? "You're offline and this roster isn't saved on this device" : "Couldn't load the roster"}
          message={roster.error instanceof NetworkError ? "Open this class once while online to save its roster for offline marking." : roster.error.message}
          onRetry={() => roster.refetch()}
        />
      )}
      {roster.data && students.length === 0 && <EmptyState title="No students in this class" body="Nothing to mark yet." />}

      {students.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="tabular text-sm text-muted">{students.length} students · {unmarked} not marked</p>
            <Button variant="secondary" disabled={unmarked === 0} onClick={() => setMarks((m) => Object.fromEntries(students.map((s) => [s.id, m[s.id] ?? "present"])))}>
              Mark remaining present
            </Button>
          </div>
          <ul aria-label="Roster" className="space-y-2">
            {students.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
                <p className="font-semibold">{s.full_name}</p>
                <p className="tabular mb-2 text-xs text-muted">{s.roll_number}</p>
                <div role="group" aria-label={`Attendance for ${s.full_name}`} className="grid grid-cols-3 gap-2">
                  {(Object.keys(LABEL) as Mark[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={marks[s.id] === m}
                      onClick={() => { setSaved(null); setMarks((x) => ({ ...x, [s.id]: m })); }}
                      className={cn("min-h-12 rounded-[var(--radius-control)] border text-sm font-semibold", marks[s.id] === m ? TONE[m] : "border-line bg-surface text-ink hover:bg-canvas")}
                    >
                      {LABEL[m]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur lg:bottom-0 lg:left-[var(--sidebar-w,16rem)]">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <p className="tabular flex-1 text-xs text-muted" aria-live="polite">
                P {counts.present} · A {counts.absent} · L {counts.late}
                {unmarked > 0 && ` · ${unmarked} left`}
              </p>
              <Button loading={saving} disabled={unmarked > 0} onClick={save} className="min-w-32">
                Save attendance
              </Button>
            </div>
            {saveError && <p role="alert" className="mx-auto mt-2 max-w-3xl text-sm text-danger-fg">{saveError}</p>}
          </div>
        </>
      )}
      <LocalSessions items={items} onRetry={() => syncNow(true)} />
    </div>
  );
}

function useCachedList<T>(profileId: string, key: string, path: string) {
  return useQuery({
    queryKey: [key, profileId],
    enabled: !!profileId,
    retry: false,
    queryFn: ({ signal }) => cachedFetch(profileId, key, () => apiFetch<T[]>(path, { signal })),
  });
}

const STATUS_COPY: Record<OutboxItem["status"], { tone: "neutral" | "warning" | "positive" | "danger"; text: string }> = {
  pending: { tone: "warning", text: "Waiting to sync" },
  syncing: { tone: "warning", text: "Syncing" },
  synced: { tone: "positive", text: "Synced" },
  failed: { tone: "danger", text: "Failed" },
  conflict: { tone: "danger", text: "Needs review" },
};

/** What is stored on this device, with the truth about each record. Nothing here is ever auto-deleted. */
export function LocalSessions({ items, onRetry }: { items: OutboxItem[]; onRetry: () => void }) {
  const shown = [...items].reverse().slice(0, 10);
  if (!shown.length) return null;
  return (
    <section aria-label="Saved on this device" className="space-y-2">
      <h2 className="text-lg font-bold">Saved on this device</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {shown.map((i) => (
          <li key={i.id} className="space-y-1 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium">{i.label}</span>
              <StatusPill tone={STATUS_COPY[i.status].tone}>{STATUS_COPY[i.status].text}</StatusPill>
            </div>
            <p className="tabular text-xs text-muted">{i.payload.records.length} students</p>
            {i.status === "conflict" && <p className="text-xs text-danger-fg">The server already has a different record for this class and period. Your marks are kept here; ask the office to review. {i.lastError}</p>}
            {i.status === "failed" && <p className="text-xs text-danger-fg">{i.lastError}{i.retryable ? "" : " This cannot be retried automatically; your marks are kept here."}</p>}
            {i.status === "pending" && i.lastError && <p className="text-xs text-muted">{i.lastError}</p>}
            {i.status === "failed" && i.retryable && (
              <Button variant="secondary" onClick={async () => { await requeue(i.id); onRetry(); }}>Retry now</Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SessionsList() {
  const q = useQuery({ queryKey: ["attendance-sessions"], queryFn: ({ signal }) => apiFetch<SessionRow[]>("/api/v1/attendance/sessions", { signal }) });
  const batches = useQuery({ queryKey: ["batches"], queryFn: ({ signal }) => apiFetch<Batch[]>("/api/v1/academic/batches", { signal }) });
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: ({ signal }) => apiFetch<Subject[]>("/api/v1/academic/subjects", { signal }) });
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);
  if (q.isPending) return <Skeleton className="h-40" />;
  if (q.isError) return <ErrorState title="Couldn't load sessions" message={q.error.message} onRetry={() => q.refetch()} />;
  if (!q.data.length) return <EmptyState title="No sessions recorded yet" body="Sessions appear here once faculty save attendance." />;
  return (
    <div className="space-y-3">
    <ul aria-label="Sessions" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      {q.data.slice(0, limit).map((s) => {
        const b = batches.data?.find((x) => x.id === s.batch_id);
        return (
          <li key={s.id}>
            <button type="button" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-canvas">
              <span>
                <b>{subjects.data?.find((x) => x.id === s.subject_id)?.name ?? "Subject"}</b>
                <span className="block text-xs text-muted">Year {b?.year_of_study} {b?.section} · period {s.period}</span>
              </span>
              <StatusPill>{s.held_on}</StatusPill>
            </button>
            {open === s.id && <CorrectionPanel session={s} />}
          </li>
        );
      })}
    </ul>
    <p className="tabular text-sm text-muted">Showing {Math.min(limit, q.data.length)} of {q.data.length} recent sessions.</p>
    {q.data.length > limit && <Button variant="secondary" onClick={() => setLimit((n) => n + 30)}>Show more</Button>}
    </div>
  );
}

interface SessionDetail extends SessionRow { records: { student_id: string; status: Mark }[] }

/** Office Admin correction: a reason is mandatory and the change is audited server-side. */
export function CorrectionPanel({ session }: { session: SessionRow }) {
  const qc = useQueryClient();
  const detail = useQuery({ queryKey: ["attendance-session", session.id], queryFn: ({ signal }) => apiFetch<SessionDetail>(`/api/v1/attendance/sessions/${session.id}`, { signal }) });
  const names = useQuery({
    queryKey: ["class-students", session.batch_id],
    queryFn: ({ signal }) => apiFetch<{ items: { id: string; full_name: string; roll_number: string }[] }>(`/api/v1/students?batch_id=${session.batch_id}&page_size=100`, { signal }),
  });
  const [edits, setEdits] = useState<Record<string, Mark>>({});
  const [reason, setReason] = useState("");
  const save = useMutation({
    mutationFn: () => apiFetch(`/api/v1/attendance/sessions/${session.id}/correction`, { method: "PUT", body: { reason, records: Object.entries(edits).map(([student_id, status]) => ({ student_id, status })) } }),
    onSuccess: async () => { setEdits({}); setReason(""); await qc.invalidateQueries({ queryKey: ["attendance-session", session.id] }); },
  });
  if (detail.isPending) return <Skeleton className="m-4 h-24" />;
  if (detail.isError) return <div className="p-4"><ErrorState title="Couldn't load this session" message={detail.error.message} onRetry={() => detail.refetch()} /></div>;
  const nameOf = (id: string) => names.data?.items.find((x) => x.id === id);
  const dirty = Object.keys(edits).length > 0;
  return (
    <div className="space-y-3 border-t border-line bg-canvas p-4">
      <ul aria-label="Session records" className="space-y-2">
        {detail.data.records.map((r) => (
          <li key={r.student_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{nameOf(r.student_id)?.full_name ?? r.student_id.slice(0, 8)}</span>
            <span role="group" aria-label={`Correct ${nameOf(r.student_id)?.full_name ?? "student"}`} className="flex gap-1">
              {(Object.keys(LABEL) as Mark[]).map((m) => {
                const cur = edits[r.student_id] ?? r.status;
                return (
                  <button key={m} type="button" aria-pressed={cur === m} onClick={() => setEdits((e) => (m === r.status ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== r.student_id)) : { ...e, [r.student_id]: m }))}
                    className={cn("min-h-11 min-w-16 rounded-[var(--radius-control)] border px-3 text-xs font-semibold", cur === m ? TONE[m] : "border-line bg-surface")}>
                    {LABEL[m]}
                  </button>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
      <label className="block text-sm font-medium">Reason for correction (required)
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${selectCls} mt-1.5 font-normal`} />
      </label>
      {save.isSuccess && <p role="status" className="text-sm font-medium text-positive-fg">Correction saved and audited.</p>}
      {save.error && <p role="alert" className="text-sm text-danger-fg">{save.error.message}</p>}
      <Button loading={save.isPending} disabled={!dirty || !reason.trim()} onClick={() => save.mutate()}>Save correction</Button>
    </div>
  );
}
