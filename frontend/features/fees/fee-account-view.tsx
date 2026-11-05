"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState } from "react";
import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { apiFetch } from "@/lib/api/client";
import { formatInr } from "@/lib/utils/format";
import type { FeeAccount } from "./fees-view";

interface Payment { id: string; amount: string; kind: string; created_at: string }
interface Account extends FeeAccount { payments: Payment[] }
interface Result { payment: Payment; receipt: { receipt_number: string; amount: string; notice: string }; created: boolean; outstanding: string }

/** Client mirror of server rules for instant feedback. */
export function validateAmount(raw: string, outstanding: number): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "Enter an amount with at most 2 decimals";
  const n = Number(t);
  if (n <= 0) return "Amount must be greater than 0";
  if (n > outstanding) return `Amount exceeds the outstanding balance of ${formatInr(String(outstanding))}`;
  return null;
}

export function FeeAccountView({ studentId }: { studentId: string }) {
  const qc = useQueryClient();
  const acct = useQuery({ queryKey: ["fee-account", studentId], queryFn: ({ signal }) => apiFetch<Account>(`/api/v1/accounts/${studentId}`, { signal }), retry: false });
  const [amount, setAmount] = useState("");
  const keyRef = useRef<string | null>(null);
  const pay = useMutation({
    mutationFn: () => {
      keyRef.current ??= crypto.randomUUID(); // same key on retry => same receipt, never a double charge
      return apiFetch<Result>("/api/v1/payments", { method: "POST", body: { idempotency_key: keyRef.current, student_id: studentId, amount } });
    },
    onSuccess: async () => {
      keyRef.current = null;
      setAmount("");
      await Promise.all([qc.invalidateQueries({ queryKey: ["fee-account", studentId] }), qc.invalidateQueries({ queryKey: ["fee-accounts"] })]);
    },
  });

  const a = acct.data;
  const outstanding = a ? Number(a.outstanding) : 0;
  const amountErr = validateAmount(amount, outstanding);

  return (
    <div className="space-y-6">
      <Link href="/fees" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-strong">← All accounts</Link>
      {acct.isPending && <Skeleton className="h-40" />}
      {acct.isError && <ErrorState title="Couldn't load this account" message={acct.error.message} onRetry={() => acct.refetch()} />}
      {a && (
        <>
          <header>
            <h1 className="text-3xl font-extrabold">{a.full_name}</h1>
            <p className="tabular text-sm text-muted">{a.roll_number} · Simulated ledger</p>
          </header>
          <section aria-label="Balance" className="grid grid-cols-3 gap-3">
            {[["Billed", a.total], ["Paid", a.paid], ["Outstanding", a.outstanding]].map(([l, v]) => (
              <Card key={l} className="space-y-1 p-4 lg:p-4"><p className="text-xs text-muted">{l}</p><p className="tabular text-lg font-extrabold">{formatInr(v)}</p></Card>
            ))}
          </section>

          {pay.isSuccess && (
            <p role="status" className="rounded-[var(--radius-control)] bg-positive-bg px-4 py-3 text-sm font-medium text-positive-fg">
              Payment recorded in demo mode. Receipt {pay.data.receipt.receipt_number} · {formatInr(pay.data.receipt.amount)}
              {!pay.data.created && " (this payment was already recorded; nothing was charged twice)"}.
            </p>
          )}
          {outstanding > 0 ? (
            <Card>
              <form aria-label="Record payment" className="space-y-3" onSubmit={(e) => { e.preventDefault(); pay.mutate(); }}>
                <h2 className="font-bold">Record a payment (demo)</h2>
                <Field label="Amount (INR)" inputMode="decimal" required value={amount} error={amountErr ?? undefined}
                  hint={`Up to ${formatInr(a.outstanding)}. Partial payments are fine.`} onChange={(e) => { setAmount(e.target.value); if (pay.isSuccess) pay.reset(); }} />
                {pay.error && <p role="alert" className="text-sm text-danger-fg">{pay.error.message}</p>}
                <Button type="submit" loading={pay.isPending} disabled={!amount.trim() || !!amountErr}>Record simulated payment</Button>
              </form>
            </Card>
          ) : (
            <p className="text-sm text-muted">Nothing outstanding. All caught up.</p>
          )}

          <section aria-label="Payment history" className="space-y-2">
            <h2 className="text-lg font-bold">Payments</h2>
            {a.payments.length === 0 && <p className="text-sm text-muted">No payments recorded yet.</p>}
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              {a.payments.map((p) => (
                <li key={p.id} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className="tabular text-muted">{new Date(p.created_at).toLocaleString("en-IN")} · {p.kind} · simulated</span>
                  <span className="tabular font-semibold">{formatInr(p.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
