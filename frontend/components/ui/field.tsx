import * as React from "react";
import { cn } from "@/lib/utils/cn";

/** Labelled input. Label is always visible; the error is announced and linked via aria-describedby. */
export const Field = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }
>(({ label, error, hint, id, className, ...props }, ref) => {
  const auto = React.useId();
  const inputId = id ?? auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-11 w-full rounded-[var(--radius-control)] border bg-surface px-3 text-base text-ink placeholder:text-muted/70 lg:min-h-10 lg:text-sm",
          error ? "border-danger-fg" : "border-line",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
Field.displayName = "Field";
