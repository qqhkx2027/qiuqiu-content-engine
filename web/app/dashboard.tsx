"use client";

import { useEffect, useMemo, useState } from "react";
import { summarizeMetrics, type Metric } from "./lib/analytics";

type Trend = { id: number; title: string; source: string; url: string; keyword: string; score: number; published_at: string };
type Project = { id: number; title: string; pillar: string; audience_problem: string; status: string };
type Item = { id: number; project_id: number; title: string; pillar: string; platform: string; status: string; scheduled_at: string };
type Record = Metric & { id: number; content_item_id: number; platform: string; title: string; recorded_at: string };
type Workspace = { trends: Trend[]; projects: Project[]; items: Item[]; metrics: Record[] };
type Tab = "工作台" | "热点雷达" | "选题库" | "内容日历" | "数据复盘";

const tabs: Tab[] = ["工作台", "热点雷达", "选题库", "内容日历", "数据复盘"];
const platforms = ["公众号", "小红书", "抖音", "视频号", "B站"];
const projectStatuses = ["待判断", "已立项", "资料准备", "创作中", "待审核", "已完成"];
const itemStatuses = ["创作中", "待审核", "待发布", "已发布"];
const initial: Workspace = { trends: [], projects: [], items: [], metrics: [] };

const compact = (n: number) => new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const dateTime = () => { const d = new Date(Date.now() + 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("工作台");
  const [data, setData] = useState<Workspace>(initial);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [idea, setIdea] = useState({ title: "", pillar: "财务自由实证", problem: "" });
  const [schedule, setSchedule] = useState({ projectId: "", platform: "公众号", scheduledAt: dateTime() });
  const [manual, setManual] = useState({ title: "", url: "", source: "小红书" });
  const [metric, setMetric] = useState({ itemId: "", views: "", likes: "", comments: "", saves: "", shares: "", followers: "" });

  useEffect(() => { void fetchData(); }, []);
  const summary = useMemo(() => summarizeMetrics(data.metrics), [data.metrics]);

  function say(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2600); }
  async function fetchData() {
    try { const r = await fetch("/api/workspace"); if (!r.ok) throw new Error(); setData(await r.json()); }
    catch { say("数据读取失败，请刷新重试"); }
    finally { setLoading(false); }
  }
  async function act(body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
    setBusy(true);
    try {
      const r = await fetch("/api/workspace", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await r.json() as Workspace & { error?: string; refreshed?: number };
      if (!r.ok) throw new Error(result.error || "操作失败");
      setData(result); say(result.refreshed !== undefined ? `已收集 ${result.refreshed} 条近期热点` : "已保存"); return true;
    } catch (e) { say(e instanceof Error ? e.message : "操作失败"); return false; }
    finally { setBusy(false); }
  }
  async function createProject(trend?: Trend) {
    const title = trend?.title || idea.title;
    if (!title.trim()) return say("请先填写选题标题");
    if (await act({ action: "create_project", title, pillar: trend?.keyword || idea.pillar, audienceProblem: idea.problem, trendId: trend?.id })) {
      setIdea({ ...idea, title: "", problem: "" }); setTab("选题库");
    }
  }
  if (loading) return <main className="loading-page">正在打开内容工作台…</main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">Q</span><span>QIUQIU<br />CONTENT ENGINE</span></div><nav>{tabs.map((name) => <button key={name} onClick={() => setTab(name)} className={tab === name ? "nav-item active" : "nav-item"}><span>{name === "工作台" ? "⌂" : name === "热点雷达" ? "◉" : name === "选题库" ? "✦" : name === "内容日历" ? "▦" : "↗"}</span>{name}</button>)}</nav><div className="sidebar-bottom"><p>已沉淀内容资产</p><strong>484 篇文章</strong></div></aside>
    <section className="workspace"><header className="topbar"><div><p className="eyebrow">秋秋个人内容操作系统</p><h1>{tab}</h1></div><button className="primary-button" onClick={() => setTab("热点雷达")}>＋ 找新选题</button></header>

      {tab === "工作台" && <>
        <section className="hero-grid"><article className="focus-card"><div><span className="section-label">本周焦点</span><h2>{data.projects[0]?.title || "先找到本周母选题"}</h2><p>{data.projects[0]?.audience_problem || "从热点和历史经验里，找到值得长期表达的内容。"}</p></div><div className="focus-footer"><span>{data.projects.length} 个母选题</span><button onClick={() => setTab("选题库")}>打开选题库 →</button></div></article><Metric label="待发布" value={String(data.items.filter((x) => x.status === "待发布").length)} /><Metric label="热点候选" value={String(data.trends.length)} /></section>
        <section className="dashboard-grid"><article className="pipeline-panel"><span className="section-label">生产进度</span><h2>内容生产线</h2><div className="pipeline">{projectStatuses.slice(0, 5).map((status) => <button key={status} onClick={() => setTab("选题库")}><span>{status}</span><strong>{data.projects.filter((x) => x.status === status).length}</strong></button>)}</div></article><article className="upcoming-panel"><span className="section-label">近期排期</span><h2>接下来发布</h2>{data.items.slice(0, 5).map((item) => <div className="upcoming-row" key={item.id}><time>{new Date(item.scheduled_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</time><span><b>{item.title}</b><small>{item.platform} · {item.status}</small></span></div>) || <Empty text="还没有排期。" />}</article></section>
        <section className="data-strip"><div><span className="section-label">累计复盘</span><h2>让数据决定下一个选题。</h2></div><div className="platform-stats"><span><b>曝光/播放</b><strong>{compact(summary.views)}</strong></span><span><b>收藏</b><strong>{compact(summary.saves)}</strong></span><span><b>新增关注</b><strong>{compact(summary.followers)}</strong></span></div><button className="text-button" onClick={() => setTab("数据复盘")}>数据复盘 →</button></section>
      </>}

      {tab === "热点雷达" && <section><div className="page-intro"><div><span className="section-label">自动收集</span><h2>近期高互动内容</h2><p>当前通过公开 B站数据，收集财务自由、存钱、提前退休、低成本旅行的近 90 天候选内容。</p></div><button className="primary-button" disabled={busy} onClick={() => act({ action: "refresh_trends" })}>{busy ? "收集中…" : "刷新热点"}</button></div><div className="trend-layout"><div className="trend-list">{data.trends.length ? data.trends.map((trend) => <article className="trend-card" key={trend.id}><div><span className="source-pill">{trend.source}</span><span className="keyword-pill">{trend.keyword}</span></div><h3>{trend.title}</h3><p>{new Date(trend.published_at).toLocaleDateString("zh-CN")} · 热度 {compact(trend.score)}</p><div className="card-actions"><a href={trend.url} target="_blank" rel="noreferrer">查看原内容</a><button onClick={() => createProject(trend)}>收为选题</button></div></article>) : <Empty text="尚未收集热点，点击右上角开始。" />}</div><form className="side-form" onSubmit={async (e) => { e.preventDefault(); if (await act({ action: "manual_trend", ...manual })) setManual({ ...manual, title: "", url: "" }); }}><span className="section-label">手动收录</span><h3>加入其他平台灵感</h3><label>标题<input required value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} /></label><label>链接<input required type="url" value={manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} /></label><label>来源<select value={manual.source} onChange={(e) => setManual({ ...manual, source: e.target.value })}><option>小红书</option><option>公众号</option><option>抖音</option><option>B站</option><option>其他</option></select></label><button className="outline-button" disabled={busy}>保存灵感</button></form></div></section>}

      {tab === "选题库" && <section><div className="page-intro"><div><span className="section-label">母内容</span><h2>一个选题，生长成多平台版本</h2><p>先识别用户问题，再决定是否投入制作。</p></div></div><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void createProject(); }}><input required placeholder="选题标题" value={idea.title} onChange={(e) => setIdea({ ...idea, title: e.target.value })} /><select value={idea.pillar} onChange={(e) => setIdea({ ...idea, pillar: e.target.value })}><option>财务自由实证</option><option>自由生活样本</option><option>搞钱与成长</option></select><input placeholder="解决什么用户问题？" value={idea.problem} onChange={(e) => setIdea({ ...idea, problem: e.target.value })} /><button className="primary-button" disabled={busy}>加入选题库</button></form><div className="project-table"><div className="table-head"><span>选题</span><span>方向</span><span>状态</span><span>动作</span></div>{data.projects.length ? data.projects.map((project) => <div className="project-row" key={project.id}><div><strong>{project.title}</strong><small>{project.audience_problem || "尚未补充用户问题"}</small></div><span>{project.pillar}</span><select value={project.status} onChange={(e) => void act({ type: "project", id: project.id, status: e.target.value }, "PATCH")}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="text-button" onClick={() => { setSchedule({ ...schedule, projectId: String(project.id) }); setTab("内容日历"); }}>安排平台版本 →</button></div>) : <Empty text="还没有选题，可以从热点雷达收录。" />}</div></section>}

      {tab === "内容日历" && <section><div className="page-intro"><div><span className="section-label">真实日期排期</span><h2>计划每个平台版本</h2><p>内容状态从创作、审核、待发布到已发布，均在这里推进。</p></div></div><form className="inline-form schedule-form" onSubmit={async (e) => { e.preventDefault(); if (!schedule.projectId) return say("请选择母选题"); if (await act({ action: "schedule_item", projectId: Number(schedule.projectId), platform: schedule.platform, scheduledAt: new Date(schedule.scheduledAt).toISOString() })) setSchedule({ ...schedule, scheduledAt: dateTime() }); }}><select required value={schedule.projectId} onChange={(e) => setSchedule({ ...schedule, projectId: e.target.value })}><option value="">选择母选题</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select><select value={schedule.platform} onChange={(e) => setSchedule({ ...schedule, platform: e.target.value })}>{platforms.map((p) => <option key={p}>{p}</option>)}</select><input required type="datetime-local" value={schedule.scheduledAt} onChange={(e) => setSchedule({ ...schedule, scheduledAt: e.target.value })} /><button className="primary-button" disabled={busy}>加入日历</button></form><div className="calendar-list">{data.items.length ? data.items.map((item) => <article className="calendar-row" key={item.id}><time><b>{new Date(item.scheduled_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</b><small>{new Date(item.scheduled_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</small></time><div><span className="platform-label">{item.platform}</span><h3>{item.title}</h3><p>{item.pillar}</p></div><select value={item.status} onChange={(e) => void act({ type: "item", id: item.id, status: e.target.value }, "PATCH")}>{itemStatuses.map((s) => <option key={s}>{s}</option>)}</select></article>) : <Empty text="日历还是空的，先为一个母选题安排平台版本。" />}</div></section>}

      {tab === "数据复盘" && <section><div className="page-intro"><div><span className="section-label">数据分析</span><h2>用真实表现决定下一轮投入</h2><p>第一版支持各平台统一手工录入，保证数据完整而不依赖账号登录。</p></div></div><div className="metrics-grid"><Metric label="总曝光/播放" value={compact(summary.views)} /><Metric label="总互动" value={compact(summary.interactions)} /><Metric label="互动率" value={`${(summary.engagementRate * 100).toFixed(1)}%`} /><Metric label="新增关注" value={compact(summary.followers)} /></div><div className="analytics-layout"><form className="metric-form" onSubmit={async (e) => { e.preventDefault(); if (!metric.itemId) return say("请选择内容"); const body = Object.fromEntries(Object.entries(metric).map(([k, v]) => [k === "itemId" ? "contentItemId" : k, k === "itemId" ? Number(v) : Number(v) || 0])); if (await act({ action: "add_metric", ...body })) setMetric({ ...metric, views: "", likes: "", comments: "", saves: "", shares: "", followers: "" }); }}><h3>录入发布表现</h3><label>内容<select required value={metric.itemId} onChange={(e) => setMetric({ ...metric, itemId: e.target.value })}><option value="">选择待发布或已发布内容</option>{data.items.filter((x) => x.status === "待发布" || x.status === "已发布").map((x) => <option key={x.id} value={x.id}>{x.platform}｜{x.title}</option>)}</select></label><div className="number-grid">{(["views", "likes", "comments", "saves", "shares", "followers"] as const).map((field) => <label key={field}>{({ views: "曝光/播放", likes: "点赞", comments: "评论", saves: "收藏", shares: "分享", followers: "新增关注" })[field]}<input type="number" min="0" value={metric[field]} onChange={(e) => setMetric({ ...metric, [field]: e.target.value })} /></label>)}</div><button className="primary-button" disabled={busy}>保存数据</button></form><div className="performance-list"><h3>最近记录</h3>{data.metrics.length ? data.metrics.slice(0, 8).map((r) => <article key={r.id}><div><strong>{r.title}</strong><small>{r.platform} · {new Date(r.recorded_at).toLocaleDateString("zh-CN")}</small></div><span>{compact(r.views)} 播放</span><span>{compact(r.saves)} 收藏</span><span>+{compact(r.followers)} 关注</span></article>) : <Empty text="发布后在左侧录入第一条数据。" />}</div></div></section>}
    </section>{notice && <div className="toast">{notice}</div>}</main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>来自已录入的数据</small></article>; }
function Empty({ text }: { text: string }) { return <div className="empty-state">{text}</div>; }
