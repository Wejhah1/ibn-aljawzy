import { cn } from "@/lib/utils";

// شارة المجموعة وشارة الحلقة من نظام التصميم: حلقة صغيرة فارغة قبل الاسم.
// المجموعة بلونها (group-1…6)، والحلقة محايدة دائماً.
const VALID_TONE = /^group-[1-6]$/;

export function GroupTag({ name, token, className }: { name: string; token?: string | null; className?: string }) {
  const tone = token && VALID_TONE.test(token) ? token : "group-6";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-6 max-w-full px-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap",
        className
      )}
      style={{ color: `var(--color-${tone}-fg)`, backgroundColor: `var(--color-${tone}-bg)` }}
    >
      <span className="h-[10px] w-[10px] rounded-full border-[1.75px] border-current shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function SessionTag({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 max-w-full px-2.5 rounded-full border border-line bg-surface-sunken text-ink-muted text-[12px] font-semibold whitespace-nowrap",
        className
      )}
    >
      <span className="h-[10px] w-[10px] rounded-full border-[1.75px] border-current shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}
