"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { apiFetch } from "@/lib/api/client";
import { formatInr } from "@/lib/utils/format";

export interface FeeAccount { student_id: string; roll_number: string; full_name: string; total: string; paid: string; outstanding: string }
const PAGE_SIZE = 25;

/** Sum decimal strings exactly (in paise) so totals never drift through floating point. */
export function sumDecimal(values: string[]): string {
  const paise = values.reduce((acc, v) => acc + Math.round(Number(v) * 100), 0);
  return (paise / 100).toFixed(2);
}

export function FeesView() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDeferredValue(q.trim());
  const list = useQuery({
    queryKey: ["fee-accounts", dq, page],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (dq) p.set("q", dq);
      return apiFetch<FeeAccount[]>(`/api/v1/fees/accounts?${p}`, { signal });
    },
    placeholderData: (prev) => prev,
  });
  const rows = list.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Fees</h1>
        <p className="text-sm text-muted">Simulated ledger. Payments are recorded in demo mode and no real money moves.</p>
      </header>
      <div>
        <label htmlFor="fee-search" className="sr-only">Search fee accounts</label>
        <input id="fee-search" type="search" value={q} placeholder="Search by name or roll number"
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base sm:max-w-md lg:min-h-10 lg:text-sm" />
      </div>

      {list.isPending && <Skeleton className="h-40" />}
      {list.isError && <ErrorState title="Couldn't load fee accounts" message={list.error.message} onRetry={() => list.refetch()} />}
      {list.data && rows.length === 0 && <EmptyState mascot={false} title="No accounts found" body="Try a different search." />}
      {rows.length > 0 && (
        <>
          <section aria-label="Reconciliation (this page)" className="grid grid-cols-3 gap-3">
            {[["Billed", sumDecimal(rows.map((r) => r.total))], ["Collected", sumDecimal(rows.map((r) => r.paid))], ["Outstanding", sumDecimal(rows.map((r) => r.outstanding))]].map(([l, v]) => (
              <Card key={l} className="space-y-1 p-4 lg:p-4">
                <p className="text-xs text-muted">{l} · this page</p>
                <p className="tabular text-lg font-extrabold">{formatInr(v)}</p>
              </Card>
            ))}
          </section>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
            <table className="w-full text-sm">
              <caption className="sr-only">Student fee accounts</caption>
              <thead className="bg-canvas text-left text-xs text-muted">
                <tr><th className="px-4 py-2">Student</th><th className="px-4 py-2 text-right">Billed</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Due</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.student_id}>
                    <td className="px-4 py-2">
                      <Link href={`/fees/${r.student_id}`} className="block min-h-11 py-1 font-medium text-ink hover:underline">{r.full_name}</Link>
                      <span className="tabular text-xs text-muted">{r.roll_number}</span>
                    </td>
                    <td className="tabular px-4 py-2 text-right">{formatInr(r.total)}</td>
                    <td className="tabular px-4 py-2 text-right">{formatInr(r.paid)}</td>
                    <td className="tabular px-4 py-2 text-right">
                      {Number(r.outstanding) > 0 ? <StatusPill tone="warning">{formatInr(r.outstanding)}</StatusPill> : <StatusPill tone="positive">Paid</StatusPill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
            <p className="tabular text-sm text-muted">Page {page}</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={rows.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
