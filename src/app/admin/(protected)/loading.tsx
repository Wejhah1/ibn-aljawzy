export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-(--space-4) min-h-[60vh]">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-brand-soft border-t-brand animate-loader-ring" />
        <div className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) bg-surface-raised border-bold border-line-strong overflow-hidden p-1 animate-loader-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-loader-dot" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-loader-dot" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-loader-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
