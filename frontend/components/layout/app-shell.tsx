"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackendStatus } from "@/components/feedback/backend-status";
import { SyncChip } from "@/features/offline/sync-chip";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { Button } from "@/components/ui/button";
import { navFor, type NavItem } from "@/features/auth/nav";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils/cn";
import type { Me } from "@/types/api";

const ROLE_LABEL = { faculty: "Faculty", office_admin: "Office Admin" } as const;

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="font-[family-name:var(--font-manrope)] leading-tight">
      <span className={cn("text-lg font-extrabold", dark ? "text-on-dark" : "text-ink")}>
        campus<span className={dark ? "text-accent" : "text-accent-strong"}>OS</span>
      </span>
      {dark && <p className="mt-1 text-xs text-on-dark/70">Campus life, in sync.</p>}
    </div>
  );
}

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border-l-2 px-3 text-sm font-medium transition-colors",
                active ? "border-accent bg-sidebar-hover text-on-dark" : "border-transparent text-on-dark/75 hover:bg-sidebar-hover hover:text-on-dark",
              )}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function UserBlock({ user, onSignOut }: { user: Me; onSignOut: () => void }) {
  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-on-dark">{user.display_name}</p>
        <p className="text-xs text-on-dark/70">{ROLE_LABEL[user.role]}</p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-medium text-on-dark/80 hover:bg-sidebar-hover hover:text-on-dark"
      >
        <LogOut size={18} aria-hidden /> Sign out
      </button>
    </div>
  );
}

export function AppShell({ user, children }: { user: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const items = navFor(user.role);
  const current = items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  const bottomNav = user.role === "faculty" && items.length >= 2;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-sidebar p-5 lg:flex" aria-label="Sidebar">
        <div className="space-y-8">
          <Wordmark dark />
          <nav aria-label="Primary">
            <NavLinks items={items} pathname={pathname} />
          </nav>
        </div>
        <UserBlock user={user} onSignOut={signOut} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <OfflineBanner />
        <header className="sticky top-0 z-20 flex h-[52px] items-center gap-3 border-b border-line bg-surface px-4 lg:h-14 lg:px-8">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="-ml-2 inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-black/5 lg:hidden"
              >
                <Menu size={22} aria-hidden />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col justify-between bg-sidebar p-5">
                <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
                <Dialog.Description className="sr-only">Pages you can open</Dialog.Description>
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <Wordmark dark />
                    <Dialog.Close asChild>
                      <button type="button" aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-on-dark hover:bg-sidebar-hover">
                        <X size={20} aria-hidden />
                      </button>
                    </Dialog.Close>
                  </div>
                  <nav aria-label="Primary mobile">
                    <Dialog.Close asChild>
                      <div>
                        <NavLinks items={items} pathname={pathname} />
                      </div>
                    </Dialog.Close>
                  </nav>
                </div>
                <UserBlock user={user} onSignOut={signOut} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <span className="lg:hidden">
            <Wordmark />
          </span>
          <p className="hidden truncate text-sm font-semibold lg:block">{current?.label ?? "CampusOS"}</p>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <SyncChip />
            <span className="hidden md:block">
              <BackendStatus />
            </span>
          </div>
        </header>
        <main className={cn("mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-8 lg:py-10", bottomNav && "pb-24 lg:pb-10")}>{children}</main>
        {bottomNav && (
          <nav aria-label="Bottom" className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
            {items.slice(0, 4).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className={cn("flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium", pathname.startsWith(href) ? "text-accent-strong" : "text-muted")}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="secondary" onClick={signOut}>
      Sign out
    </Button>
  );
}
