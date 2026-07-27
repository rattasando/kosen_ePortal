"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useNews } from "@/components/admin/contexts/NewsContext";
import { formatDate, estimatedReadTime, publishedNews } from "@/lib/utils/newsUtils";

const FONT_SIZE_CLS = { sm: "text-sm leading-7", base: "text-base leading-8", lg: "text-lg leading-9", xl: "text-xl leading-9" };

function RenderBlock({ block }) {
  switch (block.type) {
    case "paragraph": {
      const sizeCls = FONT_SIZE_CLS[block.fontSize ?? "base"] ?? FONT_SIZE_CLS.base;
      return block.content
        ? <p className={`text-foreground/80 whitespace-pre-wrap ${sizeCls}`}>{block.content}</p>
        : null;
    }
    case "heading1":
      return block.content
        ? <h2 className="text-3xl font-extrabold text-foreground leading-tight">{block.content}</h2>
        : null;
    case "heading2":
      return block.content
        ? <h2 className="text-2xl font-extrabold text-foreground leading-tight">{block.content}</h2>
        : null;
    case "heading3":
      return block.content
        ? <h3 className="text-lg font-bold text-foreground leading-tight">{block.content}</h3>
        : null;
    case "heading4":
      return block.content
        ? <h4 className="text-base font-bold text-foreground leading-tight">{block.content}</h4>
        : null;
    case "image": {
      const imgSize = block.imageSize ?? "16/9";
      return block.src ? (
        <figure>
          {imgSize === "full" ? (
            <img src={block.src} alt={block.alt || ""} className="w-full h-auto rounded-xl block" />
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: imgSize }}>
              <Image src={block.src} alt={block.alt || ""} fill className="object-cover"
                style={{ objectPosition: block.objectPosition ?? "center" }}
                sizes="(max-width: 768px) 100vw, 800px" />
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-2 text-center text-xs text-muted">{block.caption}</figcaption>
          )}
        </figure>
      ) : null;
    }
    case "spacer":
      return <div className="h-6" />;
    default:
      return null;
  }
}

function SidebarNewsItem({ item, currentId }) {
  const isActive = item.id === currentId;
  return (
    <Link
      href={`/news/${item.id}`}
      className={`group flex gap-3 items-start py-3 border-b border-border/60 last:border-0 rounded-lg px-2 -mx-2 transition-colors ${
        isActive ? "bg-primary/5" : "hover:bg-slate-50"
      }`}
    >
      {item.image && (
        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className={`rounded-full px-3.5 py-1 text-sm font-bold w-fit ${item.catColor}`}>
          {item.category}
        </span>
        <p className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
          isActive ? "text-primary" : "text-foreground group-hover:text-primary"
        }`}>
          {item.title}
        </p>
        <time className="text-sm font-semibold text-muted">{formatDate(item.publishedAt)}</time>
      </div>
    </Link>
  );
}

export default function NewsDetailPage() {
  const { id } = useParams();
  const { news } = useNews();
  const pub = publishedNews(news);
  const item = pub.find((n) => n.id === id);

  if (!item) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-5xl mb-4">📰</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ไม่พบข่าวนี้</h1>
        <p className="text-sm text-muted mb-6">ข่าวที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
        <Link href="/news" className="btn-primary">← กลับหน้าข่าว</Link>
      </div>
    );
  }

  const blocks = item.blocks || [];
  const sidebarNews = pub.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="w-full max-w-[1600px] mx-auto px-5 md:px-10 py-8">
        <div className="flex gap-6 items-start">

          {/* ── Main article ── */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">

            {/* Hero image */}
            {item.image && (() => {
              const ha = item.heroAspect ?? "21/9";
              return ha === "full" ? (
                <img src={item.image} alt={item.title} className="w-full h-auto block" />
              ) : (
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: ha, minHeight: "240px" }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    priority
                    className="object-cover"
                    style={{ objectPosition: item.imagePosition ?? "center" }}
                    sizes="(max-width: 1024px) 100vw, 1000px"
                  />
                </div>
              );
            })()}

            <div className="p-8 lg:p-10">
              {/* Category + Headline */}
              <div className="mb-5">
                <span className={`rounded-full px-3.5 py-1 text-sm font-bold ${item.catColor}`}>
                  {item.category}
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                  {item.title}
                </h1>
              </div>

              {/* Meta */}
              <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border pb-6">
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <span className="text-base">✍️</span> {item.author}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                  <span className="text-base">📅</span> {formatDate(item.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <span className="text-base">⏱️</span> {estimatedReadTime(blocks)}
                </span>
              </div>

              {/* Lead / excerpt */}
              {item.excerpt && (
                <p className="mb-8 border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">
                  {item.excerpt}
                </p>
              )}

              {/* Body blocks */}
              <div className="space-y-5">
                {blocks.map((block) => (
                  <RenderBlock key={block.id} block={block} />
                ))}
              </div>

              {/* Tags */}
              {item.tags?.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                  <span className="text-xs text-muted">แท็ก:</span>
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-6 rounded-2xl border border-border bg-white p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary mb-1">ข่าวล่าสุด</h3>
              <p className="text-xs text-muted mb-4">อัปเดตล่าสุดจากสถาบัน</p>
              <div className="flex flex-col">
                {sidebarNews.map((n) => (
                  <SidebarNewsItem key={n.id} item={n} currentId={id} />
                ))}
              </div>
              <Link
                href="/news"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                ดูข่าวทั้งหมด →
              </Link>
            </div>
          </aside>

        </div>

        {/* ── Back button ── */}
        <div className="mt-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-muted hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            กลับหน้าข่าวทั้งหมด
          </Link>
        </div>

      </div>
    </div>
  );
}
