// هيكل مبدئي بنفس شكل البوابة، يظهر فوراً أثناء تحميل البيانات
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-(--radius-sm) bg-surface-sunken ${className}`} />;
}

export default function PortalLoading() {
  return (
    <main className="min-h-screen bg-surface" aria-busy="true" aria-label="جارٍ تحميل بيانات الابن">
      <header className="border-b border-line bg-surface-raised">
        <div className="max-w-[720px] mx-auto px-(--space-4) h-16 flex items-center gap-(--space-2)">
          <Block className="h-9 w-9" />
          <Block className="h-4 w-28" />
        </div>
      </header>
      <div className="max-w-[720px] mx-auto px-(--space-4) pt-(--space-4) md:pt-(--space-8) space-y-(--space-4)">
        <div className="rounded-(--radius-md) border-bold border-line bg-surface-raised p-(--space-4)">
          <div className="flex items-center gap-(--space-3)">
            <div className="h-16 w-16 rounded-full animate-pulse bg-surface-sunken" />
            <div className="space-y-2 flex-1">
              <Block className="h-5 w-2/3" />
              <Block className="h-4 w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-(--space-2) mt-(--space-4)">
            <Block className="h-[84px]" />
            <Block className="h-[84px]" />
            <Block className="h-[84px]" />
          </div>
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-(--radius-md) border-bold border-line bg-surface-raised p-(--space-4) space-y-(--space-3)">
            <Block className="h-6 w-40" />
            <Block className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-(--space-2)">
              <Block className="h-14" />
              <Block className="h-14" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
