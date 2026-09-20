import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-on-brand border-bold border-line-strong shadow-brutal hover:bg-brand-hover active:shadow-brutal-press active:translate-x-[2px] active:translate-y-[2px]",
  secondary:
    "bg-surface-raised text-ink border-bold border-line-strong shadow-brutal-sm hover:bg-surface-sunken active:shadow-brutal-press active:translate-x-[1px] active:translate-y-[1px]",
  danger:
    "bg-danger text-on-danger border-bold border-line-strong shadow-brutal-sm hover:opacity-90 active:shadow-brutal-press active:translate-x-[1px] active:translate-y-[1px]",
  outline:
    "bg-transparent text-ink border-bold border-line-strong hover:bg-surface-sunken",
  ghost: "bg-transparent text-ink hover:bg-surface-sunken",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-(--radius-sm)",
  md: "h-11 px-4 text-sm gap-2 rounded-(--radius-sm)",
  lg: "h-12 px-6 text-base gap-2 rounded-(--radius-md)",
  icon: "h-11 w-11 rounded-(--radius-sm)",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-(--duration-fast) ease-(--ease-standard) disabled:opacity-(--opacity-disabled) disabled:pointer-events-none select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
