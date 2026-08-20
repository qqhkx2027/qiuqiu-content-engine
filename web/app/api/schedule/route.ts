import { env } from "cloudflare:workers";
import { hasValidSession } from "../../lib/auth";

const createTableSql = `CREATE TABLE IF NOT EXISTS content_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  pillar TEXT NOT NULL DEFAULT '待归类',
  status TEXT NOT NULL DEFAULT '选题中',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  platform TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '秋',
  color TEXT NOT NULL DEFAULT 'purple',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const seedRows = [
  ["WorkBuddy 新手教程", "AI × 学习", "制作中", "周二", "10:00", "公众号", "秋", "purple"],
  ["3 个 AI 学习提效方法", "AI × 学习", "待发布", "周三", "18:30", "小红书", "秋", "yellow"],
  ["3 个 AI 学习提效方法", "AI × 学习", "制作中", "周四", "19:30", "抖音", "秋", "pink"],
  ["把学习工具换成 AI 后", "生活提效", "选题中", "周五", "10:00", "公众号", "吉", "green"],
  ["普通人也能用的 AI 工作台", "AI 工具", "制作中", "周六", "18:30", "小红书", "秋", "purple"],
  ["普通人也能用的 AI 工作台", "AI 工具", "待发布", "周日", "20:00", "抖音", "秋", "yellow"],
];

type ScheduleInput = {
  title?: string;
  pillar?: string;
  status?: string;
  date?: string;
  time?: string;
  platform?: string;
  owner?: string;
  color?: string;
};

async function requireScheduleAccess() {
  if (!(await hasValidSession())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.DB) return Response.json({ error: "Database unavailable" }, { status: 503 });
  await env.DB.prepare(createTableSql).run();
  return null;
}

async function seedIfEmpty() {
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM content_schedule").first<{ count: number }>();
  if (Number(count?.count ?? 0) > 0) return;
  await env.DB.batch(seedRows.map((row) => env.DB.prepare("INSERT INTO content_schedule (title, pillar, status, date, time, platform, owner, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(...row)));
}

function serialize(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: String(row.title),
    pillar: String(row.pillar),
    status: String(row.status),
    date: String(row.date),
    time: String(row.time),
    platform: String(row.platform),
    owner: String(row.owner),
    color: String(row.color),
  };
}

export async function GET() {
  const denied = await requireScheduleAccess();
  if (denied) return denied;
  await seedIfEmpty();
  const result = await env.DB.prepare("SELECT id, title, pillar, status, date, time, platform, owner, color FROM content_schedule ORDER BY id ASC").all();
  return Response.json(result.results.map((row) => serialize(row as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const denied = await requireScheduleAccess();
  if (denied) return denied;
  let input: ScheduleInput;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const allowedPlatforms = ["公众号", "小红书", "抖音"];
  if (!input.title?.trim() || !input.date || !input.time || !allowedPlatforms.includes(input.platform ?? "")) {
    return Response.json({ error: "Missing schedule fields" }, { status: 400 });
  }
  const inserted = await env.DB.prepare("INSERT INTO content_schedule (title, pillar, status, date, time, platform, owner, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(input.title.trim(), input.pillar ?? "待归类", input.status ?? "选题中", input.date, input.time, input.platform, input.owner ?? "秋", input.color ?? "purple")
    .run();
  const row = await env.DB.prepare("SELECT id, title, pillar, status, date, time, platform, owner, color FROM content_schedule WHERE id = ?").bind(inserted.meta.last_row_id).first();
  return Response.json(serialize(row as Record<string, unknown>), { status: 201 });
}

export async function PATCH(request: Request) {
  const denied = await requireScheduleAccess();
  if (denied) return denied;
  let input: { id?: number; status?: string };
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!input.id || !statusValues.includes(input.status ?? "")) {
    return Response.json({ error: "Invalid status update" }, { status: 400 });
  }
  await env.DB.prepare("UPDATE content_schedule SET status = ? WHERE id = ?").bind(input.status, input.id).run();
  return Response.json({ ok: true });
}

const statusValues = ["选题中", "制作中", "待发布", "已发布"];
