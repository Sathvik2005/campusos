"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status-pill";
import { apiFetch } from "@/lib/api/client";
import type { AcademicYear, Assignment, Batch, Faculty, Programme, Subject } from "@/types/api";

const selectCls = "min-h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base lg:min-h-10 lg:text-sm";

function useList<T>(key: string, path: string) {
  return useQuery({ queryKey: [key], queryFn: ({ signal }) => apiFetch<T[]>(path, { signal }) });
}

/** POST/PATCH/DELETE with inline server error (409 duplicate, 422 validation) and list refresh. */
function useAction(invalidate: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: "POST" | "PATCH" | "DELETE"; body?: unknown }) =>
      apiFetch<unknown>(path, { method, body }),
    onSuccess: () => Promise.all(invalidate.map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Rows({ items, empty }: { items: React.ReactNode[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">{items}</ul>;
}

function Row({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
      <div className="min-w-0 text-sm">{children}</div>
      {action}
    </li>
  );
}

function FormShell({ title, onSubmit, error, pending, children }: { title: string; onSubmit: () => void; error: string | null; pending: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
        aria-label={title}
      >
        <h3 className="font-bold">{title}</h3>
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        {error && <p role="alert" className="text-sm text-danger-fg">{error}</p>}
        <Button type="submit" loading={pending}>{title}</Button>
      </form>
    </Card>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        <select required value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} mt-1.5 font-normal`}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    </div>
  );
}

const msg = (e: unknown) => (e instanceof Error ? e.message : null);

function ActiveToggle({ path, active, invalidate }: { path: string; active: boolean; invalidate: string[] }) {
  const act = useAction(invalidate);
  return (
    <div className="flex items-center gap-2">
      <StatusPill tone={active ? "positive" : "neutral"}>{active ? "Active" : "Inactive"}</StatusPill>
      <Button variant="secondary" loading={act.isPending} onClick={() => act.mutate({ path, method: "PATCH", body: { is_active: !active } })}>
        {active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}

function YearsSection({ years }: { years: AcademicYear[] }) {
  const act = useAction(["academic-years"]);
  const blank = { label: "", starts_on: "", ends_on: "" };
  const [f, setF] = useState(blank);
  return (
    <Section title="Academic years">
      <Rows empty="No academic years yet." items={years.map((y) => <Row key={y.id}><b>{y.label}</b> <span className="tabular text-muted">{y.starts_on} → {y.ends_on}</span></Row>)} />
      <FormShell title="Add academic year" pending={act.isPending} error={msg(act.error)} onSubmit={() => act.mutate({ path: "/api/v1/academic/academic-years", method: "POST", body: f }, { onSuccess: () => setF(blank) })}>
        <Field label="Label" placeholder="2026-27" required value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        <span />
        <Field label="Starts on" type="date" required value={f.starts_on} onChange={(e) => setF({ ...f, starts_on: e.target.value })} />
        <Field label="Ends on" type="date" required value={f.ends_on} onChange={(e) => setF({ ...f, ends_on: e.target.value })} />
      </FormShell>
    </Section>
  );
}

function ClassesSection({ batches, programmes, years }: { batches: Batch[]; programmes: Programme[]; years: AcademicYear[] }) {
  const act = useAction(["batches"]);
  const [f, setF] = useState({ programme_id: "", academic_year_id: "", year_of_study: "1", section: "" });
  const yl = (id: string) => years.find((y) => y.id === id)?.label ?? "";
  return (
    <Section title="Classes" hint="A class is a year of study and section within an academic year.">
      <Rows empty="No classes yet." items={batches.map((b) => (
        <Row key={b.id} action={<ActiveToggle path={`/api/v1/academic/batches/${b.id}`} active={b.is_active} invalidate={["batches"]} />}>
          <b>Year {b.year_of_study} · Section {b.section}</b> <span className="text-muted">{yl(b.academic_year_id)}</span>
        </Row>
      ))} />
      <FormShell title="Add class" pending={act.isPending} error={msg(act.error)} onSubmit={() => act.mutate({ path: "/api/v1/academic/batches", method: "POST", body: { ...f, year_of_study: Number(f.year_of_study) } })}>
        <Select label="Programme" value={f.programme_id} onChange={(v) => setF({ ...f, programme_id: v })} options={programmes.map((p) => ({ value: p.id, label: p.name }))} />
        <Select label="Academic year" value={f.academic_year_id} onChange={(v) => setF({ ...f, academic_year_id: v })} options={years.map((y) => ({ value: y.id, label: y.label }))} />
        <Field label="Year of study" type="number" min={1} max={6} required value={f.year_of_study} onChange={(e) => setF({ ...f, year_of_study: e.target.value })} />
        <Field label="Section" required maxLength={10} value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} />
      </FormShell>
    </Section>
  );
}

function SubjectsSection({ subjects, programmes }: { subjects: Subject[]; programmes: Programme[] }) {
  const act = useAction(["subjects"]);
  const [f, setF] = useState({ programme_id: "", code: "", name: "", credits: "3" });
  return (
    <Section title="Subjects">
      <Rows empty="No subjects yet." items={subjects.map((s) => (
        <Row key={s.id} action={<ActiveToggle path={`/api/v1/academic/subjects/${s.id}`} active={s.is_active} invalidate={["subjects"]} />}>
          <b>{s.name}</b> <span className="tabular text-muted">{s.code} · {s.credits} credits</span>
        </Row>
      ))} />
      <FormShell title="Add subject" pending={act.isPending} error={msg(act.error)} onSubmit={() => act.mutate({ path: "/api/v1/academic/subjects", method: "POST", body: { ...f, credits: Number(f.credits) } })}>
        <Select label="Programme" value={f.programme_id} onChange={(v) => setF({ ...f, programme_id: v })} options={programmes.map((p) => ({ value: p.id, label: p.name }))} />
        <Field label="Code" required maxLength={20} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <Field label="Name" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Field label="Credits" type="number" min={1} max={10} required value={f.credits} onChange={(e) => setF({ ...f, credits: e.target.value })} />
      </FormShell>
    </Section>
  );
}

function FacultySection({ faculty }: { faculty: Faculty[] }) {
  const act = useAction(["faculty"]);
  const blank = { full_name: "", employee_code: "", email: "" };
  const [f, setF] = useState(blank);
  return (
    <Section title="Faculty">
      <Rows empty="No faculty yet." items={faculty.map((x) => <Row key={x.id}><b>{x.full_name}</b> <span className="text-muted">{x.employee_code} · {x.email}</span></Row>)} />
      <FormShell title="Add faculty" pending={act.isPending} error={msg(act.error)} onSubmit={() => act.mutate({ path: "/api/v1/academic/faculty", method: "POST", body: f }, { onSuccess: () => setF(blank) })}>
        <Field label="Full name" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <Field label="Employee code" required value={f.employee_code} onChange={(e) => setF({ ...f, employee_code: e.target.value })} />
        <Field label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </FormShell>
    </Section>
  );
}

function AssignmentsSection(p: { assignments: Assignment[]; faculty: Faculty[]; subjects: Subject[]; batches: Batch[] }) {
  const act = useAction(["assignments"]);
  const del = useAction(["assignments"]);
  const [f, setF] = useState({ faculty_id: "", subject_id: "", batch_id: "" });
  const name = <T extends { id: string }>(list: T[], id: string, label: (x: T) => string) => {
    const x = list.find((i) => i.id === id);
    return x ? label(x) : "—";
  };
  return (
    <Section title="Teaching assignments" hint="Faculty can only take attendance and enter marks for their assigned subject and class.">
      <Rows empty="No assignments yet." items={p.assignments.map((a) => (
        <Row key={a.id} action={<Button variant="destructive" loading={del.isPending} onClick={() => del.mutate({ path: `/api/v1/academic/assignments/${a.id}`, method: "DELETE" })}>Remove</Button>}>
          <b>{name(p.faculty, a.faculty_id, (x) => x.full_name)}</b> <span className="text-muted">{name(p.subjects, a.subject_id, (x) => x.name)} · {name(p.batches, a.batch_id, (x) => `Year ${x.year_of_study} ${x.section}`)}</span>
        </Row>
      ))} />
      {del.error && <p role="alert" className="text-sm text-danger-fg">{msg(del.error)}</p>}
      <FormShell title="Assign faculty" pending={act.isPending} error={msg(act.error)} onSubmit={() => act.mutate({ path: "/api/v1/academic/assignments", method: "POST", body: f })}>
        <Select label="Faculty" value={f.faculty_id} onChange={(v) => setF({ ...f, faculty_id: v })} options={p.faculty.map((x) => ({ value: x.id, label: x.full_name }))} />
        <Select label="Subject" value={f.subject_id} onChange={(v) => setF({ ...f, subject_id: v })} options={p.subjects.filter((s) => s.is_active).map((x) => ({ value: x.id, label: x.name }))} />
        <Select label="Class" value={f.batch_id} onChange={(v) => setF({ ...f, batch_id: v })} options={p.batches.filter((b) => b.is_active).map((x) => ({ value: x.id, label: `Year ${x.year_of_study} · ${x.section}` }))} />
      </FormShell>
    </Section>
  );
}

export function AcademicView() {
  const programmes = useList<Programme>("programmes", "/api/v1/academic/programmes");
  const years = useList<AcademicYear>("academic-years", "/api/v1/academic/academic-years");
  const batches = useList<Batch>("batches", "/api/v1/academic/batches");
  const subjects = useList<Subject>("subjects", "/api/v1/academic/subjects");
  const faculty = useList<Faculty>("faculty", "/api/v1/academic/faculty");
  const assignments = useList<Assignment>("assignments", "/api/v1/academic/assignments");
  const all = [programmes, years, batches, subjects, faculty, assignments];
  const failed = all.find((q) => q.isError);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Academics</h1>
        <p className="text-sm text-muted">{programmes.data?.map((p) => p.name).join(", ") ?? "Programme"} · master data for your campus.</p>
      </header>
      {failed && <ErrorState title="Couldn't load academic data" message={failed.error!.message} onRetry={() => all.forEach((q) => q.refetch())} />}
      {!failed && all.some((q) => q.isPending) && (
        <div role="status" aria-label="Loading academics" className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      )}
      {!failed && all.every((q) => q.data) && (
        <>
          <YearsSection years={years.data!} />
          <ClassesSection batches={batches.data!} programmes={programmes.data!} years={years.data!} />
          <SubjectsSection subjects={subjects.data!} programmes={programmes.data!} />
          <FacultySection faculty={faculty.data!} />
          <AssignmentsSection assignments={assignments.data!} faculty={faculty.data!} subjects={subjects.data!} batches={batches.data!} />
        </>
      )}
    </div>
  );
}
