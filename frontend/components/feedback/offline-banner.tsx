"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/use-online";

/** Shown only when the browser reports no connection. Pending counts live in the sync chip, bound to the IndexedDB outbox. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-sidebar px-4 py-2 text-sm text-canvas">
      <WifiOff size={16} aria-hidden />
      You&apos;re offline. Your work is safe on this device and syncs when you reconnect.
    </div>
  );
}
