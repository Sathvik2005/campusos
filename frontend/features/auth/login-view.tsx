"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wordmark } from "@/components/layout/app-shell";
import { Miso } from "@/components/shared/miso";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useAuth } from "./auth-provider";

export const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginView() {
  const { state, signIn } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (state.status === "authenticated") router.replace("/dashboard");
  }, [state.status, router]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const err = await signIn(email, password);
    if (err) setFormError(err);
  });

  const unconfigured = state.status === "unconfigured";
  const notice = state.status === "anonymous" ? state.message : state.status === "forbidden" ? state.message : null;

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(420px,5fr)]">
      <section aria-hidden className="hidden flex-col justify-between bg-sidebar p-12 text-on-dark lg:flex">
        <Wordmark dark />
        <div className="max-w-md space-y-6">
          <Miso size={96} />
          <h2 className="text-4xl font-extrabold leading-tight">Campus life, in sync.</h2>
          <p className="text-on-dark/75">
            Attendance that keeps working when classroom Wi-Fi doesn&apos;t. Marks, fees and student follow-up, in one calm workspace.
          </p>
        </div>
        <p className="text-xs text-on-dark/50">Prototype for one campus · B.Tech CSE</p>
      </section>

      <section className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="lg:hidden">
              <Miso size={56} />
            </div>
            <div className="lg:hidden">
              <Wordmark />
            </div>
            <h1 className="text-3xl font-extrabold">Sign in</h1>
            <p className="text-sm text-muted">Use the account your Office Admin set up for you.</p>
          </div>

          {unconfigured && (
            <p role="alert" className="rounded-[var(--radius-control)] bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              Sign-in isn&apos;t configured for this environment yet (missing Supabase settings).
            </p>
          )}
          {notice && (
            <p role="alert" className="rounded-[var(--radius-control)] bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              {notice}
            </p>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field label="Email" type="email" autoComplete="username" inputMode="email" error={errors.email?.message} {...register("email")} />
            <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
            {formError && (
              <p role="alert" className="rounded-[var(--radius-control)] bg-danger-bg px-4 py-3 text-sm text-danger-fg">
                {formError}
              </p>
            )}
            <Button type="submit" variant="accent" className="w-full" loading={isSubmitting} disabled={unconfigured}>
              Sign in
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
