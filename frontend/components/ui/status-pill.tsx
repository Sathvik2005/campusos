import { cn } from "@/lib/utils/cn";

const tones = {
  positive: "bg-positive-bg text-positive-fg",
  warning: "bg-warning-bg text-warning-fg",
  neutral: "bg-black/5 text-ink",
  danger: "bg-danger-bg text-danger-fg",
} as const;

/** Status is always conveyed by text as well as colour. */
export function StatusPill({ tone = "neutral", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold", tones[tone])}>{children}</span>
  );
}
