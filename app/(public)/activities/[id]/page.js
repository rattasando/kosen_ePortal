"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useActivities } from "@/components/admin/contexts/ActivitiesContext";
import { publishedActivities } from "@/lib/utils/newsUtils";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  } catch { return iso; }
}

function RenderBlock({ block }) {
  switch (block.type) {
    case "paragraph":
      return block.content
        ? <p className="text-base leading-8 text-foreground/80 whitespace-pre-wrap">{block.content}</p>
        : null;
    case "heading2":
      return block.content
        ? <h2 className="text-2xl font-extrabold text-foreground leading-tight">{block.content}</h2>
        : null;
    case "heading3":
      return block.content
        ? <h3 className="text-lg font-bold text-foreground leading-tight">{block.content}</h3>
        : null;
    case "image":
      return block.src ? (
        <figure>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            <Image src={block.src} alt={block.alt || ""} fill className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px" />
          </div>
          {block.caption && <figcaption className="mt-2 text-center text-xs text-muted">{block.caption}</figcaption>}
        </figure>
      ) : null;
    case "spacer":
      return <div className="h-6" />;
    default:
      return null;
  }
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const { id } = useParams();
  const { activities } = useActivities();
  const pub = publishedActivities(activities);
  const item = pub.find((a) => a.id === id);

  if (!item) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-5xl mb-4">🎪</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ไม่พบกิจกรรมนี้</h1>
        <p className="text-sm text-muted mb-6">กิจกรรมที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
        <Link href="/activities" className="btn-primary">← กลับหน้ากิจกรรม</Link>
      </div>
    );
  }

  const blocks = item.blocks || [];
  const related = pub.filter((a) => a.id !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">

      {/* Back */}
      <div className="border-b border-border bg-white">
        <div className="page-container py-3">
          <Link href="/activities" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors">
            ← กลับหน้ากิจกรรมทั้งหมด
          </Link>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="mx-auto max-w-4xl">

          {/* Hero image */}
          {item.image && (
            <figure className="mb-8">
              <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                <Image src={item.image} alt={item.title} fill priority className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px" />
                {item.featured && (
                  <span className="absolute left-4 top-4 flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
                    ⭐ กิจกรรมเด่น
                  </span>
                )}
              </div>
            </figure>
          )}

          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── Main content ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type + title */}
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.typeColor}`}>{item.type}</span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                  {item.title}
                </h1>
              </div>

              {/* Excerpt */}
              {item.excerpt && (
                <p className="border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">
                  {item.excerpt}
                </p>
              )}

              {/* Blocks */}
              {blocks.length > 0 && (
                <div className="space-y-5">
                  {blocks.map((block) => <RenderBlock key={block.id} block={block} />)}
                </div>
              )}

              {/* Tags */}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
                  <span className="text-xs text-muted">แท็ก:</span>
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-slate-50 p-5 space-y-4">
                <p className="font-bold text-foreground">รายละเอียดกิจกรรม</p>
                <div className="space-y-3">
                  <InfoRow icon="📅" label="วันที่จัด" value={formatDate(item.date)} />
                  <InfoRow icon="📍" label="สถานที่" value={item.location} />
                  <InfoRow icon="🏛️" label="จัดโดย" value={item.organizer} />
                </div>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-12">
              <p className="mb-5 text-xs font-bold uppercase tracking-widest text-primary">กิจกรรมอื่นๆ ที่น่าสนใจ</p>
              <div className="grid gap-5 sm:grid-cols-3">
                {related.map((rel) => (
                  <Link key={rel.id} href={`/activities/${rel.id}`} className="group block">
                    <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
                      {rel.image ? (
                        <Image src={rel.image} alt={rel.title} fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 33vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-slate-300">🎪</div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rel.typeColor}`}>{rel.type}</span>
                      <p className="mt-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {rel.title}
                      </p>
                      <time className="text-[11px] text-muted">{formatDate(rel.date)}</time>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
