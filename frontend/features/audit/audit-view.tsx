"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import type { Page } from "@/types/api";

interface AuditEvent { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; reason: string | null; created_at: string }
const PAGE_SIZE = 25;
const selectCls = "min-h-11 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base lg:min-h-10 lg:text-sm";
const ENTITIES = ["", "student", "attendance_session", "assessment_component", "payment", "academic_year", "batch", "subject", "assignment", "mentor_task", "risk_assessment"];

/** Read-only. The API has no write, edit or delete route for audit events. */
export function AuditView() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["audit", entity, page],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (entity) p.set("entity_type", entity);
      return apiFetch<Page<AuditEvent>>(`/api/v1/audit?${p}`, { signal });
    },
    placeholderData: (prev) => prev,
  });
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.page_size)) : 1;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Audit history</h1>
        <p className="text-sm text-muted">Who changed what, and when. Read-only.</p>
      </header>
      <div>
        <label htmlFor="audit-entity" className="sr-only">Filter by record type</label>
        <select id="audit-entity" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className={selectCls}>
          {ENTITIES.map((e) => <option key={e} value={e}>{e ? e.replaceAll("_", " ") : "All record types"}</option>)}
        </select>
      </div>
      {q.isPending && <Skeleton className="h-40" />}
      {q.isError && <ErrorState title="Couldn't load audit history" message={q.error.message} onRetry={() => q.refetch()} />}
      {q.data && q.data.items.length === 0 && <EmptyState title="Nothing recorded yet" body="Actions appear here as people use the system." />}
      {q.data && q.data.items.length > 0 && (
        <>
          <ul aria-label="Audit events" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {q.data.items.map((e) => (
              <li key={e.id} className="px-4 py-2 text-sm">
                <p className="font-semibold">{e.action}</p>
                <p className="tabular text-xs text-muted">
                  {new Date(e.created_at).toLocaleString("en-IN")} · {e.entity_type.replaceAll("_", " ")}
                  {e.entity_id && ` ${e.entity_id.slice(0, 8)}`} · actor {e.actor_id ? e.actor_id.slice(0, 8) : "system"}
                </p>
                {e.reason && <p className="text-xs">Reason: {e.reason}</p>}
              </li>
            ))}
          </ul>
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
            <p className="tabular text-sm text-muted">{q.data.total} events · page {q.data.page} of {pages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
