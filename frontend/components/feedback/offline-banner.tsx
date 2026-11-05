"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/use-online";

/** Shown only when the browser reports no connection. Queue/pending counts arrive with offline attendance (Phase 8). */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-sidebar px-4 py-2 text-sm text-canvas">
      <WifiOff size={16} aria-hidden />
      You&apos;re offline. Anything already loaded stays on screen; saving to the server resumes when you reconnect.
    </div>
  );
}
