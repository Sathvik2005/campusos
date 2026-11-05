"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/states";
import { SignOutButton } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

/** Presentation-level route protection. The API independently enforces authentication and permissions. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "anonymous" || state.status === "unconfigured") {
      router.replace("/login");
    }
  }, [state, router]);

  if (state.status === "authenticated") return <AppShell user={state.user}>{children}</AppShell>;

  if (state.status === "forbidden") {
    return (
      <Centered>
        <ErrorState title="No access yet" message={state.message} />
        <div className="mt-4">
          <SignOutButton />
        </div>
      </Centered>
    );
  }
  if (state.status === "error") {
    return (
      <Centered>
        <ErrorState message={state.message} onRetry={retry} />
      </Centered>
    );
  }
  return (
    <Centered>
      <div role="status" aria-label="Loading your workspace" className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">{children}</div>;
}
