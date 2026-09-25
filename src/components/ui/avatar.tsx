import { cn } from "@/lib/utils";

// لون ثابت لكل اسم مشتق من ألوان المجموعات، حتى يتميّز كل طالب بلونه
function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const n = (Math.abs(hash) % 6) + 1;
  return { fg: `var(--color-group-${n}-fg)`, bg: `var(--color-group-${n}-bg)` };
}

export function Avatar({
  name,
  src,
  size = 44,
  className,
  bordered = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  bordered?: boolean;
}) {
  const tone = toneFor(name);
  const initial = name.trim().charAt(0) || "؟";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none",
        bordered && "border-bold border-line-strong",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), color: tone.fg, backgroundColor: tone.bg }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initial
      )}
    </span>
  );
}

// الاسم الأول والأخير فقط، لعرض الأسماء الطويلة في المساحات الضيقة
export function shortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName.trim();
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
