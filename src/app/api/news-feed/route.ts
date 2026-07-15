import { NextRequest, NextResponse } from "next/server";

/**
 * 时事热点 RSS 聚合
 *
 * 支持 ?category= 参数过滤：
 *   - public_admin → 筛选公共管理/政府相关
 *   - economy      → 经济相关
 *   - law          → 法律相关
 *   不加参数则返回全部
 */

const RSS_SOURCES = [
  { name: "人民网·时政", url: "http://www.people.com.cn/rss/politics.xml" },
  { name: "人民网·观点", url: "http://www.people.com.cn/rss/opinion.xml" },
  { name: "新华网·要闻", url: "http://www.xinhuanet.com/politics/news_politics.xml" },
  { name: "央视新闻", url: "https://news.cctv.com/rss/chinageneral.xml" },
  { name: "中国政府网", url: "https://www.gov.cn/xinwen/xinwen.xml" },
];

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

// 分类关键词
const CATEGORY_FILTERS: Record<string, string[]> = {
  public_admin: ["治理", "政府", "公共", "行政", "政策", "改革", "服务", "基层", "管理", "制度"],
  economy: ["经济", "市场", "金融", "投资", "消费", "贸易", "增长", "就业"],
  law: ["法律", "法规", "立法", "司法", "法治", "合规", "监管", "条例"],
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(req: NextRequest) {
  const cat = req.nextUrl.searchParams.get("category") || "";
  const start = Date.now();
  const allItems: NewsItem[] = [];

  const fetches = RSS_SOURCES.map(async (src) => {
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return;
      const xml = await res.text();
      const items = xml.includes("<item>")
        ? parseRSS(xml, src.name)
        : xml.includes("<entry>")
        ? parseAtom(xml, src.name)
        : [];
      allItems.push(...items);
    } catch { /* 静默 */ }
  });

  await Promise.allSettled(fetches);

  // 分类过滤
  let items = allItems;
  const keywords = cat ? CATEGORY_FILTERS[cat] : null;
  if (keywords) {
    items = items.filter((item) =>
      keywords.some((kw) => item.title.includes(kw) || item.description.includes(kw)),
    );
  }

  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const elapsed = Date.now() - start;

  return NextResponse.json({
    items: items.slice(0, 30),
    total: items.length,
    updatedAt: new Date().toISOString(),
    elapsed,
  });
}

function parseRSS(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const g = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const x = r.exec(m![1]);
      return x ? x[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
    };
    const title = g("title");
    if (title) items.push({ title, link: g("link"), description: stripHTML(g("description")).slice(0, 200), pubDate: g("pubDate"), source: sourceName });
  }
  return items;
}

function parseAtom(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<entry>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const g = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const x = r.exec(m![1]);
      return x ? x[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
    };
    const title = g("title");
    if (title) {
      const linkMatch = m[1].match(/<link[^>]*href="([^"]+)"/);
      items.push({ title, link: linkMatch ? linkMatch[1] : "", description: stripHTML(g("summary") || g("content")).slice(0, 200), pubDate: g("published") || g("updated"), source: sourceName });
    }
  }
  return items;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
