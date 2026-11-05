import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 lg:min-h-10",
  {
    variants: {
      variant: {
        primary: "bg-ink text-on-dark hover:bg-sidebar-hover",
        accent: "bg-accent-strong text-white hover:bg-[#5b21b6]",
        secondary: "border border-line bg-surface text-ink hover:bg-canvas",
        ghost: "text-ink hover:bg-black/5",
        destructive: "border border-danger-fg/30 bg-surface text-danger-fg hover:bg-danger-bg",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" size={16} aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
