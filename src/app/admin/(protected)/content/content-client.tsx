"use client";

import { useActionState, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  saveHomepageContentAction,
  createNewsPostAction,
  toggleNewsPublishedAction,
  deleteNewsPostAction,
  type FormState,
} from "./actions";
import { Save, Plus, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";

interface NewsPost {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  category: string;
  is_published: boolean;
  published_at: string;
}

const NEWS_CATEGORY_PRESETS = ["إعلان", "إنجاز", "فعالية"];

export function ContentClient({
  homepage,
  news,
}: {
  homepage: { hero_title: string; hero_subtitle: string; logo_url: string };
  news: NewsPost[];
}) {
  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[900px] mx-auto">
      <h1 className="text-[22px] leading-[30px] font-bold text-ink mb-(--space-2)">محتوى الصفحة الرئيسية</h1>
      <p className="text-sm text-ink-muted mb-(--space-6)">
        عدّل نص الصفحة الرئيسية العامة، الشعار، وانشر الأخبار والصور التي تظهر للزوار.
      </p>

      <HomepageContentForm initial={homepage} />
      <NewsSection initial={news} />
    </main>
  );
}

function HomepageContentForm({ initial }: { initial: { hero_title: string; hero_subtitle: string; logo_url: string } }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveHomepageContentAction, null);

  return (
    <Card className="mb-(--space-8)">
      <CardTitle className="mb-(--space-4)">نص الصفحة الرئيسية والشعار</CardTitle>
      <form action={formAction} className="space-y-(--space-4)">
        <div>
          <Label htmlFor="hero_title">العنوان الرئيسي (اتركه فارغاً لاستخدام الاسم الافتراضي)</Label>
          <Input id="hero_title" name="hero_title" defaultValue={initial.hero_title} placeholder="حلقات ابن الجوزي" />
        </div>
        <div>
          <Label htmlFor="hero_subtitle">الوصف التعريفي</Label>
          <Textarea
            id="hero_subtitle"
            name="hero_subtitle"
            rows={3}
            defaultValue={initial.hero_subtitle}
            placeholder="برنامج تحفيظ صيفي بمسجد الطرباق — يجمع بين حفظ القرآن الكريم..."
          />
        </div>
        <div>
          <Label htmlFor="logo_url">رابط الشعار (صورة)</Label>
          <Input id="logo_url" name="logo_url" dir="ltr" defaultValue={initial.logo_url} placeholder="https://..." />
        </div>
        {state?.error && <p className="text-[13px] font-semibold text-danger">{state.error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            <Save size={14} /> {pending ? "جارِ الحفظ..." : state?.success ? "تم الحفظ" : "حفظ"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NewsSection({ initial }: { initial: NewsPost[] }) {
  const [news, setNews] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-(--space-4)">
        <h2 className="text-[16px] font-bold text-ink">الأخبار والصور</h2>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
          <Plus size={14} /> خبر جديد
        </Button>
      </div>

      {formOpen && <NewsPostForm onCreated={(post) => { setNews((prev) => [post, ...prev]); setFormOpen(false); }} />}

      <div className="space-y-(--space-3) mt-(--space-4)">
        {news.length === 0 && (
          <Card>
            <CardDescription>لا توجد أخبار منشورة بعد.</CardDescription>
          </Card>
        )}
        {news.map((n) => (
          <Card key={n.id} className="flex items-start gap-(--space-3)">
            {n.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.image_url} alt={n.title} className="h-16 w-16 rounded-(--radius-sm) object-cover shrink-0 border border-line" />
            ) : (
              <div className="h-16 w-16 rounded-(--radius-sm) bg-surface-sunken flex items-center justify-center shrink-0 text-ink-faint">
                <ImageIcon size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-(--space-2)">
                <p className="text-sm font-semibold text-ink truncate">{n.title}</p>
                <Badge tone={n.is_published ? "success" : "neutral"}>{n.is_published ? "منشور" : "مخفي"}</Badge>
                <Badge tone="neutral">{n.category}</Badge>
              </div>
              {n.body && <p className="text-[12px] text-ink-muted mt-1 line-clamp-2">{n.body}</p>}
              <p className="text-xs text-ink-faint mt-1">{new Date(n.published_at).toLocaleDateString("ar-SA")}</p>
            </div>
            <div className="flex items-center gap-(--space-1) shrink-0">
              <button
                onClick={async () => {
                  setNews((prev) => prev.map((p) => (p.id === n.id ? { ...p, is_published: !p.is_published } : p)));
                  await toggleNewsPublishedAction(n.id, !n.is_published);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-ink-muted hover:bg-surface-sunken"
                title={n.is_published ? "إخفاء" : "نشر"}
                aria-label={n.is_published ? "إخفاء" : "نشر"}
              >
                {n.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                onClick={async () => {
                  setNews((prev) => prev.filter((p) => p.id !== n.id));
                  await deleteNewsPostAction(n.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-danger hover:bg-danger-soft"
                title="حذف"
                aria-label="حذف"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewsPostForm({ onCreated }: { onCreated: (post: NewsPost) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState(NEWS_CATEGORY_PRESETS[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = category === "أخرى";
  const finalCategory = isCustom ? customCategory.trim() : category;

  return (
    <Card>
      <div className="space-y-(--space-3)">
        <div>
          <Label htmlFor="news_title">العنوان</Label>
          <Input id="news_title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="news_body">النص</Label>
          <Textarea id="news_body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="news_category">نوع الخبر</Label>
          <Select id="news_category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {NEWS_CATEGORY_PRESETS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="أخرى">أخرى (اكتب النوع)</option>
          </Select>
          {isCustom && (
            <Input
              className="mt-(--space-2)"
              placeholder="اكتب نوع الخبر"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}
        </div>
        <div>
          <Label htmlFor="news_image">رابط صورة (اختياري)</Label>
          <Input id="news_image" dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button
            disabled={!title.trim() || (isCustom && !customCategory.trim()) || pending}
            onClick={async () => {
              setPending(true);
              const fd = new FormData();
              fd.set("title", title);
              fd.set("body", body);
              fd.set("image_url", imageUrl);
              fd.set("category", finalCategory);
              const res = await createNewsPostAction(null, fd);
              if (res?.error) {
                setError(res.error);
                setPending(false);
                return;
              }
              onCreated({
                id: crypto.randomUUID(),
                title,
                body: body || null,
                image_url: imageUrl || null,
                category: finalCategory,
                is_published: true,
                published_at: new Date().toISOString(),
              });
              setPending(false);
            }}
          >
            <Save size={14} /> {pending ? "جارِ الحفظ..." : "نشر الخبر"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
