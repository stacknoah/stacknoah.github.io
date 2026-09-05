export interface DailySource {
  title: string;
  href: string;
  external: boolean;
}

export interface DailyRecord {
  id: string;
  date: string;
  text: string;
  sources: DailySource[];
}

export function webSource(title: string, href: string, site: string): DailySource | null {
  try {
    const url = new URL(href);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    const external = url.origin !== new URL(site).origin;
    return { title: title.trim() || url.hostname, href: external ? url.href : url.pathname + url.search + url.hash, external };
  } catch { return null; }
}

export function monthKey(date: string, offset = 0): string {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function monthWindow(records: DailyRecord[], end: string) {
  return [-2, -1, 0].map((offset) => {
    const key = monthKey(end, offset);
    const month = Number(key.slice(5));
    const label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
    return { key, label, tone: (month - 1) % 3, records: records.filter((record) => record.date.startsWith(key)) };
  });
}
