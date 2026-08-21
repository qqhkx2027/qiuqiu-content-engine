import { env } from "cloudflare:workers";
import { hasValidSession } from "../../lib/auth";

const tables = [
  `CREATE TABLE IF NOT EXISTS trend_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, external_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL, source TEXT NOT NULL, url TEXT NOT NULL,
    keyword TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL, collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS content_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    pillar TEXT NOT NULL DEFAULT '待归类', audience_problem TEXT NOT NULL DEFAULT '',
    source_trend_id INTEGER, status TEXT NOT NULL DEFAULT '待判断',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL,
    platform TEXT NOT NULL, status TEXT NOT NULL DEFAULT '创作中',
    scheduled_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS performance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, content_item_id INTEGER NOT NULL,
    views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0, saves INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0, followers INTEGER NOT NULL DEFAULT 0,
    recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS idx_trend_items_score_published ON trend_items(score, published_at)",
  "CREATE INDEX IF NOT EXISTS idx_content_items_scheduled_at ON content_items(scheduled_at)",
  "CREATE INDEX IF NOT EXISTS idx_content_items_project_id ON content_items(project_id)",
  "CREATE INDEX IF NOT EXISTS idx_performance_records_content_item_id ON performance_records(content_item_id)",
];

async function requireAccess() {
  if (!(await hasValidSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return Response.json({ error: "Database unavailable" }, { status: 503 });
  await env.DB.batch(tables.map((sql) => env.DB.prepare(sql)));
  return null;
}

async function snapshot() {
  const [trends, projects, items, metrics] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM trend_items ORDER BY score DESC, published_at DESC LIMIT 60"),
    env.DB.prepare("SELECT * FROM content_projects ORDER BY created_at DESC"),
    env.DB.prepare(`SELECT i.*, p.title, p.pillar FROM content_items i
      JOIN content_projects p ON p.id = i.project_id ORDER BY i.scheduled_at ASC`),
    env.DB.prepare(`SELECT r.*, i.platform, p.title FROM performance_records r
      JOIN content_items i ON i.id = r.content_item_id
      JOIN content_projects p ON p.id = i.project_id ORDER BY r.recorded_at DESC`),
  ]);
  return { trends: trends.results, projects: projects.results, items: items.results, metrics: metrics.results };
}

export async function GET() {
  const denied = await requireAccess();
  if (denied) return denied;
  return Response.json(await snapshot());
}

type Input = Record<string, string | number | undefined>;
const platforms = ["公众号", "小红书", "抖音", "视频号", "B站"];
const projectStatuses = ["待判断", "已立项", "资料准备", "创作中", "待审核", "已完成"];
const itemStatuses = ["创作中", "待审核", "待发布", "已发布"];

function cleanTitle(value: unknown) {
  return String(value ?? "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').trim();
}

async function refreshTrends() {
  const keywords = ["财务自由", "存钱", "提前退休", "低成本旅行"];
  const since = Date.now() / 1000 - 90 * 86400;
  const collected: Array<Record<string, unknown>> = [];
  for (const keyword of keywords) {
    const url = new URL("https://api.bilibili.com/x/web-interface/search/type");
    url.search = new URLSearchParams({ search_type: "video", keyword, order: "pubdate", page: "1" }).toString();
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 qiuqiu-content-engine" } });
    if (!response.ok) continue;
    const payload = await response.json() as { data?: { result?: Array<Record<string, unknown>> } };
    for (const video of payload.data?.result ?? []) {
      if (Number(video.pubdate ?? 0) < since) continue;
      const score = Number(video.play ?? 0) + Number(video.like ?? 0) * 8 + Number(video.favorites ?? 0) * 12;
      collected.push({ ...video, keyword, score });
    }
  }
  const selected = collected.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 24);
  if (selected.length) {
    await env.DB.batch(selected.map((video) => env.DB.prepare(`INSERT INTO trend_items
      (external_id, title, source, url, keyword, score, published_at)
      VALUES (?, ?, 'B站', ?, ?, ?, ?)
      ON CONFLICT(external_id) DO UPDATE SET title=excluded.title, score=excluded.score, collected_at=CURRENT_TIMESTAMP`)
      .bind(String(video.bvid), cleanTitle(video.title), String(video.arcurl), String(video.keyword), Number(video.score), new Date(Number(video.pubdate) * 1000).toISOString())));
  }
  return selected.length;
}

export async function POST(request: Request) {
  const denied = await requireAccess();
  if (denied) return denied;
  let input: Input;
  try { input = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }

  if (input.action === "refresh_trends") {
    try {
      const count = await refreshTrends();
      return Response.json({ ...(await snapshot()), refreshed: count });
    } catch {
      return Response.json({ error: "热点来源暂时不可用，请稍后重试" }, { status: 502 });
    }
  }

  if (input.action === "manual_trend") {
    const title = cleanTitle(input.title);
    const url = String(input.url ?? "").trim();
    if (!title || !url.startsWith("http")) return Response.json({ error: "请填写标题和有效链接" }, { status: 400 });
    await env.DB.prepare(`INSERT INTO trend_items (external_id, title, source, url, keyword, score, published_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)`).bind(`manual-${Date.now()}`, title, String(input.source ?? "手动收录"), url, String(input.keyword ?? "灵感"), new Date().toISOString()).run();
  } else if (input.action === "create_project") {
    const title = cleanTitle(input.title);
    if (!title) return Response.json({ error: "选题标题不能为空" }, { status: 400 });
    await env.DB.prepare(`INSERT INTO content_projects (title, pillar, audience_problem, source_trend_id, status)
      VALUES (?, ?, ?, ?, '待判断')`).bind(title, String(input.pillar ?? "待归类"), String(input.audienceProblem ?? ""), input.trendId ? Number(input.trendId) : null).run();
  } else if (input.action === "schedule_item") {
    if (!input.projectId || !platforms.includes(String(input.platform)) || !String(input.scheduledAt ?? "")) {
      return Response.json({ error: "排期信息不完整" }, { status: 400 });
    }
    await env.DB.prepare(`INSERT INTO content_items (project_id, platform, status, scheduled_at)
      VALUES (?, ?, '创作中', ?)`).bind(Number(input.projectId), String(input.platform), String(input.scheduledAt)).run();
    await env.DB.prepare("UPDATE content_projects SET status='已立项' WHERE id=? AND status='待判断'").bind(Number(input.projectId)).run();
  } else if (input.action === "add_metric") {
    if (!input.contentItemId) return Response.json({ error: "请选择已发布内容" }, { status: 400 });
    const numbers = ["views", "likes", "comments", "saves", "shares", "followers"].map((key) => Math.max(0, Number(input[key] ?? 0) || 0));
    await env.DB.prepare(`INSERT INTO performance_records
      (content_item_id, views, likes, comments, saves, shares, followers) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(Number(input.contentItemId), ...numbers).run();
    await env.DB.prepare("UPDATE content_items SET status='已发布' WHERE id=?").bind(Number(input.contentItemId)).run();
  } else {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  return Response.json(await snapshot());
}

export async function PATCH(request: Request) {
  const denied = await requireAccess();
  if (denied) return denied;
  let input: Input;
  try { input = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (input.type === "project" && input.id && projectStatuses.includes(String(input.status))) {
    await env.DB.prepare("UPDATE content_projects SET status=? WHERE id=?").bind(String(input.status), Number(input.id)).run();
  } else if (input.type === "item" && input.id && itemStatuses.includes(String(input.status))) {
    await env.DB.prepare("UPDATE content_items SET status=? WHERE id=?").bind(String(input.status), Number(input.id)).run();
  } else {
    return Response.json({ error: "Invalid update" }, { status: 400 });
  }
  return Response.json(await snapshot());
}
