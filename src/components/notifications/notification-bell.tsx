"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUnreadParentNotesAction, markNotificationReadAction, type UnreadParentNote } from "./actions";

export function NotificationBell() {
  const [notes, setNotes] = useState<UnreadParentNote[]>([]);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = async () => {
    setNotes(await getUnreadParentNotesAction());
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // إشعار فوري: أي رسالة جديدة من ولي أمر تظهر هنا مباشرة بدون تحديث الصفحة
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        // اسم فريد لكل تحميل للمكوّن: تفادي تعارض React StrictMode (التركيب المزدوج في
        // وضع التطوير) الذي يعيد استخدام قناة سابقة لم يكتمل إلغاء اشتراكها بعد.
        .channel(`parent-notes-notifications-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "parent_notes", filter: "sender=eq.parent" },
          () => {
            load();
            setFlash(true);
            setTimeout(() => setFlash(false), 2000);
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const openNote = async (note: UnreadParentNote) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    setOpen(false);
    markNotificationReadAction(note.id);
    router.push(`/admin/students/${note.studentId}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-(--radius-sm) border-bold border-line-strong bg-surface-raised text-ink-muted hover:bg-surface-sunken transition-colors ${
          flash ? "animate-pulse border-brand text-brand" : ""
        }`}
        title="الإشعارات"
        aria-label="الإشعارات"
      >
        <Bell size={18} />
        {notes.length > 0 && (
          <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger text-on-danger text-[10px] font-bold px-1 border border-line-strong">
            {notes.length > 9 ? "9+" : notes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[320px] max-h-[420px] overflow-y-auto rounded-(--radius-md) border-bold border-line-strong bg-surface-raised shadow-brutal z-50">
          <div className="px-(--space-4) h-11 flex items-center border-b border-line">
            <p className="text-[13px] font-bold text-ink">إشعارات ولي الأمر</p>
          </div>
          {notes.length === 0 ? (
            <p className="text-[13px] text-ink-muted text-center py-(--space-6)">لا توجد رسائل جديدة.</p>
          ) : (
            <div>
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNote(n)}
                  className="w-full flex items-start gap-(--space-2) px-(--space-4) py-(--space-3) border-b border-line last:border-b-0 hover:bg-surface-sunken text-right"
                >
                  <MessageSquare size={15} className="text-brand mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink truncate">{n.studentName}</p>
                    <p className="text-[12px] text-ink-muted line-clamp-2">{n.message}</p>
                    <p className="text-xs text-ink-faint mt-1">{new Date(n.createdAt).toLocaleString("ar-SA")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
