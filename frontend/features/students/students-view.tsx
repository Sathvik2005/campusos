"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { apiFetch } from "@/lib/api/client";
import type { Batch, Page, StudentRow } from "@/types/api";

const PAGE_SIZE = 25;
const inputCls =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base lg:min-h-10 lg:text-sm";

export function StudentsView() {
  const [q, setQ] = useState("");
  const [batchId, setBatchId] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDeferredValue(q.trim());

  const batches = useQuery({ queryKey: ["batches"], queryFn: ({ signal }) => apiFetch<Batch[]>("/api/v1/academic/batches", { signal }) });
  const list = useQuery({
    queryKey: ["students", dq, batchId, page],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (dq) p.set("q", dq);
      if (batchId) p.set("batch_id", batchId);
      return apiFetch<Page<StudentRow>>(`/api/v1/students?${p}`, { signal });
    },
    placeholderData: (prev) => prev,
  });
  const batchLabel = (id: string) => {
    const b = batches.data?.find((x) => x.id === id);
    return b ? `Year ${b.year_of_study} · ${b.section}` : "—";
  };
  const data = list.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Students</h1>
        <p className="text-sm text-muted">Find anyone in your classes by name or roll number.</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="student-search" className="sr-only">Search students</label>
          <input
            id="student-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or roll number"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="student-batch" className="sr-only">Filter by class</label>
          <select
            id="student-batch"
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} sm:w-auto`}
          >
            <option value="">All classes</option>
            {batches.data?.map((b) => (
              <option key={b.id} value={b.id}>{`Year ${b.year_of_study} · ${b.section}`}</option>
            ))}
          </select>
        </div>
      </div>

      {list.isPending && (
        <div role="status" aria-label="Loading students" className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}
      {list.isError && <ErrorState title="Couldn't load students" message={list.error.message} onRetry={() => list.refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No students found" body={dq || batchId ? "Try a different search or class." : "No students are in your classes yet."} />
      )}
      {data && data.items.length > 0 && (
        <>
          <ul aria-label="Students" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {data.items.map((s) => (
              <li key={s.id}>
                <Link href={`/students/${s.id}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 hover:bg-canvas">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.full_name}</span>
                    <span className="tabular block text-xs text-muted">{s.roll_number} · {batchLabel(s.batch_id)}</span>
                  </span>
                  <StatusPill tone={s.status === "active" ? "positive" : "neutral"}>{s.status === "active" ? "Active" : "Inactive"}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
            <p className="tabular text-sm text-muted">{data.total} students · page {data.page} of {pages}</p>
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
