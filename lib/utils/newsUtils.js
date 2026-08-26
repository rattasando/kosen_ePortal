export function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch /* v8 ignore next */ {
    return iso;
  }
}

export function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch /* v8 ignore next */ {
    return iso;
  }
}

export function estimatedReadTime(blocks = []) {
  const text = blocks.map((b) => b.content || "").join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} นาที`;
}

export function publishedNews(news = []) {
  return news
    .filter((n) => n.status === "published")
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function publishedActivities(activities = []) {
  return activities
    .filter((a) => a.status === "published")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
