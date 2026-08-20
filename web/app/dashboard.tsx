"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "选题中" | "制作中" | "待发布" | "已发布";
type Platform = "公众号" | "小红书" | "抖音";
type PlatformFilter = "全部" | Platform;
type ContentCard = {
  id: number;
  title: string;
  pillar: string;
  status: Status;
  date: string;
  time: string;
  platform: Platform;
  owner: string;
  color: string;
};

const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const statusOrder: Status[] = ["选题中", "制作中", "待发布", "已发布"];
const platforms: Array<{ name: Platform; icon: string; color: string; format: string }> = [
  { name: "公众号", icon: "文", color: "wechat", format: "文章" },
  { name: "小红书", icon: "书", color: "xiaohongshu", format: "竖版视频" },
  { name: "抖音", icon: "音", color: "douyin", format: "竖版视频" },
];

const initialCards: ContentCard[] = [
  { id: 1, title: "WorkBuddy 新手教程", pillar: "AI × 学习", status: "制作中", date: "周二", time: "10:00", platform: "公众号", owner: "秋", color: "purple" },
  { id: 2, title: "3 个 AI 学习提效方法", pillar: "AI × 学习", status: "待发布", date: "周三", time: "18:30", platform: "小红书", owner: "秋", color: "yellow" },
  { id: 3, title: "3 个 AI 学习提效方法", pillar: "AI × 学习", status: "制作中", date: "周四", time: "19:30", platform: "抖音", owner: "秋", color: "pink" },
  { id: 4, title: "把学习工具换成 AI 后", pillar: "生活提效", status: "选题中", date: "周五", time: "10:00", platform: "公众号", owner: "吉", color: "green" },
  { id: 5, title: "普通人也能用的 AI 工作台", pillar: "AI 工具", status: "制作中", date: "周六", time: "18:30", platform: "小红书", owner: "秋", color: "purple" },
  { id: 6, title: "普通人也能用的 AI 工作台", pillar: "AI 工具", status: "待发布", date: "周日", time: "20:00", platform: "抖音", owner: "秋", color: "yellow" },
];

const history = [
  ["普通打工人，存多少钱能提前退休！", "提前退休", "2025-09-04"],
  ["偷偷变强大，提升自我的学习网站推荐", "学习成长", "2020-05-03"],
  ["5 年存到 300 万的搞钱精华", "存钱理财", "2024-04-22"],
];

function platformMeta(platform: Platform) {
  return platforms.find((item) => item.name === platform) ?? platforms[0];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("工作台");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("全部");
  const [cards, setCards] = useState(initialCards);
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftPlatform, setDraftPlatform] = useState<Platform>("公众号");
  const [draftDate, setDraftDate] = useState("周一");
  const [draftTime, setDraftTime] = useState("10:00");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let disposed = false;
    fetch("/api/schedule")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("schedule request failed")))
      .then((data: ContentCard[]) => {
        if (!disposed && Array.isArray(data)) setCards(data);
      })
      .catch(() => {
        if (!disposed) showToast("排期读取失败，当前显示的是临时数据");
      });
    return () => { disposed = true; };
  }, []);

  const filteredHistory = useMemo(() => {
    if (!query.trim()) return history;
    return history.filter((item) => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const filteredCards = useMemo(() => {
    if (platformFilter === "全部") return cards;
    return cards.filter((card) => card.platform === platformFilter);
  }, [cards, platformFilter]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function openComposer(title = "", date = "周一") {
    setDraft(title);
    setDraftDate(date);
    setShowComposer(true);
  }

  async function moveCard(id: number) {
    const currentCard = cards.find((card) => card.id === id);
    if (!currentCard) return;
    const next = statusOrder[(statusOrder.indexOf(currentCard.status) + 1) % statusOrder.length];
    setCards((current) => current.map((card) => card.id === id ? { ...card, status: next } : card));
    try {
      const response = await fetch("/api/schedule", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: next }) });
      if (!response.ok) throw new Error("status update failed");
      showToast("内容状态已更新");
    } catch {
      setCards((current) => current.map((card) => card.id === id ? currentCard : card));
      showToast("状态同步失败，请重试");
    }
  }

  async function addIdea() {
    if (!draft.trim()) return;
    const meta = platformMeta(draftPlatform);
    const temporaryId = Date.now();
    const newCard: ContentCard = {
      id: temporaryId,
      title: draft.trim(),
      pillar: "待归类",
      status: "选题中",
      date: draftDate,
      time: draftTime,
      platform: draftPlatform,
      owner: "秋",
      color: meta.color === "wechat" ? "purple" : meta.color === "xiaohongshu" ? "yellow" : "pink",
    };
    setCards((current) => [...current, newCard]);
    setDraft("");
    setShowComposer(false);
    try {
      const response = await fetch("/api/schedule", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(newCard) });
      if (!response.ok) throw new Error("schedule save failed");
      const saved = await response.json() as ContentCard;
      setCards((current) => current.map((card) => card.id === temporaryId ? saved : card));
      showToast(`${draftPlatform}排期已保存`);
    } catch {
      setCards((current) => current.filter((card) => card.id !== temporaryId));
      showToast("排期保存失败，请重试");
    }
  }

  function selectNav(item: string) {
    setActiveTab(item);
    if (item === "内容日历") {
      window.setTimeout(() => document.getElementById("content-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">Q</span><span>QIUQIU<br />CONTENT ENGINE</span></div>
        <nav aria-label="主导航">
          {["工作台", "内容日历", "选题库", "数据复盘", "内容资产"].map((item) => (
            <button className={activeTab === item ? "nav-item active" : "nav-item"} key={item} onClick={() => selectNav(item)}>
              <span>{item === "工作台" ? "⌂" : item === "内容日历" ? "▦" : item === "选题库" ? "✦" : item === "数据复盘" ? "↗" : "◫"}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="team-row"><span className="avatar purple">秋</span><span className="avatar yellow">吉</span><span className="avatar add">+</span></div>
          <p>2 位协作者在线</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">2026 · 内容工作台</p><h1>{activeTab === "工作台" ? "本周，稳稳地做出好内容。" : activeTab}</h1></div>
          <div className="top-actions"><button className="icon-button" aria-label="通知">◌</button><button className="primary-button" onClick={() => openComposer()}>＋ 新建内容</button></div>
        </header>

        <section className="hero-grid">
          <article className="focus-card">
            <div><span className="section-label">本周焦点</span><h2>AI × 学习成长<br />转型试水周</h2><p>一篇母内容，拆成公众号文章、小红书和抖音竖版视频，按平台节奏协同发布。</p></div>
            <div className="focus-footer"><span>已排 {cards.length} 条</span><div className="progress"><i style={{ width: `${Math.min(100, cards.length * 10)}%` }} /></div><button onClick={() => selectNav("内容日历")}>查看计划 →</button></div>
          </article>
          <article className="metric-card"><span>本周待发布</span><strong>{cards.filter((c) => c.status === "待发布").length}</strong><small>内容已进入发布队列</small><div className="mini-bars"><i /><i /><i /><i /><i /></div></article>
          <article className="metric-card accent"><span>历史内容资产</span><strong>484</strong><small>篇文章已可检索复用</small><button onClick={() => setActiveTab("内容资产")}>立即检索 →</button></article>
        </section>

        <section className="section-head schedule-title" id="content-calendar"><div><span className="section-label">内容排期</span><h2>这一周怎么排</h2><p>按平台安排发布时间，避免同一条母内容互相撞车。</p></div><button className="text-button" onClick={() => openComposer()}>＋ 添加排期</button></section>
        <section className="schedule-toolbar" aria-label="平台筛选">
          <div className="platform-tabs">
            {(["全部", ...platforms.map((item) => item.name)] as PlatformFilter[]).map((item) => (
              <button className={platformFilter === item ? "platform-tab active" : "platform-tab"} key={item} onClick={() => setPlatformFilter(item)}>
                {item === "全部" ? "全部平台" : <><span className={`platform-dot ${platformMeta(item).color}`}>{platformMeta(item).icon}</span>{item}</>}
                <b>{item === "全部" ? cards.length : cards.filter((card) => card.platform === item).length}</b>
              </button>
            ))}
          </div>
          <span className="schedule-hint">点击内容卡片可推进状态</span>
        </section>
        <section className="week-board schedule-board" aria-label="按平台查看本周内容排期">
          {days.map((day, index) => {
            const dayCards = filteredCards.filter((card) => card.date === day);
            return <div className={index === 0 ? "day-column today" : "day-column"} key={day}><header><span>{day}</span>{index === 0 && <b>今天</b>}</header>{dayCards.length ? dayCards.map((card) => { const meta = platformMeta(card.platform); return <button className={`schedule-card ${card.color}`} key={card.id} onClick={() => moveCard(card.id)} title="点击推进内容状态"><div className="schedule-card-top"><span className={`platform-badge ${meta.color}`}>{meta.icon} {card.platform}</span><small>{card.time}</small></div><h3>{card.title}</h3><div className="schedule-card-bottom"><span>{card.pillar}</span><em>{card.status}</em></div></button>; }) : <button className="empty-slot" onClick={() => openComposer("", day)} aria-label={`${day}添加排期`}>＋</button>}</div>;
          })}
        </section>

        <section className="lower-grid">
          <article className="kanban-panel"><div className="panel-head"><div><span className="section-label">生产看板</span><h2>卡住的内容，一眼看清</h2></div><span className="hint">点击卡片推进状态</span></div><div className="kanban-columns">{statusOrder.slice(0, 3).map((status) => <div key={status}><h3>{status}<b>{cards.filter((card) => card.status === status).length}</b></h3>{cards.filter((card) => card.status === status).map((card) => <button className="kanban-card" onClick={() => moveCard(card.id)} key={card.id}><i className={card.color} /><span><strong>{card.title}</strong><small>{card.platform} · {card.date} {card.time}</small></span><small>{card.owner}</small></button>)}</div>)}</div></article>
          <article className="topic-panel"><span className="section-label">选题助手</span><h2>从历史内容，找到新角度</h2><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试：普通人如何用 AI 学习" /></div><div className="history-list">{filteredHistory.map(([title, tag, date]) => <button key={title} onClick={() => openComposer(`${title} 的 AI 新版本`)}><span><b>{title}</b><small>{tag} · {date}</small></span><i>↗</i></button>)}</div><button className="outline-button" onClick={() => openComposer()}>生成本周新选题</button></article>
        </section>

        <section className="data-strip"><div><span className="section-label">平台数据</span><h2>先看有效内容，再决定下周投入。</h2></div><div className="platform-stats"><span><b>公众号</b><strong>514</strong><small>昨日阅读</small></span><span><b>抖音</b><strong>33.4 万</strong><small>当前粉丝</small></span><span><b>小红书</b><strong>24.3 万</strong><small>当前粉丝</small></span></div><button className="text-button" onClick={() => showToast("平台数据导入会在下一版接入")}>导入数据 →</button></section>
      </section>

      {showComposer && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowComposer(false)}><form className="composer" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); addIdea(); }}><button type="button" className="close" onClick={() => setShowComposer(false)}>×</button><span className="section-label">新建排期</span><h2>把内容放进这一周</h2><label>选题名称<input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="例如：AI 帮我把学习计划做完了" required /></label><div className="composer-grid"><label>发布平台<select value={draftPlatform} onChange={(event) => setDraftPlatform(event.target.value as Platform)}>{platforms.map((platform) => <option key={platform.name}>{platform.name}</option>)}</select></label><label>排期日<select value={draftDate} onChange={(event) => setDraftDate(event.target.value)}>{days.map((day) => <option key={day}>{day}</option>)}</select></label></div><label>发布时间<input type="time" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} /></label><p>新内容会进入「选题中」，并出现在对应平台和日期的排期栏。</p><button className="primary-button" type="submit">加入排期</button></form></div>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
