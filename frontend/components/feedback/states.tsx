import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Miso } from "@/components/shared/miso";

/** Miso is friendly furniture: pass mascot={false} on data surfaces (fees, marks, audit) where the brand rules forbid her. */
export function EmptyState({ title, body, action, mascot = true }: { title: string; body: string; action?: React.ReactNode; mascot?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      {mascot && <Miso size={64} />}
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

/** No mascot on errors (design rule). Plain language, retry where safe. */
export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <AlertCircle className="mt-0.5 shrink-0 text-danger-fg" size={20} aria-hidden />
      <div className="space-y-2">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
