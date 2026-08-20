"use client";

import { useMemo, useState } from "react";

type Status = "选题中" | "制作中" | "待发布" | "已发布";
type ContentCard = {
  id: number;
  title: string;
  pillar: string;
  status: Status;
  date: string;
  formats: string[];
  owner: string;
  color: string;
};

const initialCards: ContentCard[] = [
  { id: 1, title: "WorkBuddy 新手教程", pillar: "AI × 学习", status: "制作中", date: "周二", formats: ["公众号", "竖版", "横版"], owner: "秋", color: "purple" },
  { id: 2, title: "3 个 AI 学习提效方法", pillar: "AI × 学习", status: "待发布", date: "周三", formats: ["抖音", "小红书", "快手"], owner: "秋", color: "yellow" },
  { id: 3, title: "把学习工具换成 AI 后", pillar: "生活提效", status: "选题中", date: "周四", formats: ["公众号", "视频号"], owner: "吉", color: "green" },
  { id: 4, title: "普通人也能用的 AI 工作台", pillar: "AI 工具", status: "制作中", date: "周五", formats: ["B 站", "视频号"], owner: "秋", color: "pink" },
];

const history = [
  ["普通打工人，存多少钱能提前退休！", "提前退休", "2025-09-04"],
  ["偷偷变强大，提升自我的学习网站推荐", "学习成长", "2020-05-03"],
  ["5 年存到 300 万的搞钱精华", "存钱理财", "2024-04-22"],
];

const statusOrder: Status[] = ["选题中", "制作中", "待发布", "已发布"];

export default function Home() {
  const [activeTab, setActiveTab] = useState("工作台");
  const [cards, setCards] = useState(initialCards);
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");

  const filteredHistory = useMemo(() => {
    if (!query.trim()) return history;
    return history.filter((item) => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  function moveCard(id: number) {
    setCards((current) => current.map((card) => {
      if (card.id !== id) return card;
      const next = statusOrder[(statusOrder.indexOf(card.status) + 1) % statusOrder.length];
      return { ...card, status: next };
    }));
  }

  function addIdea() {
    if (!draft.trim()) return;
    setCards((current) => [...current, {
      id: Date.now(), title: draft.trim(), pillar: "待归类", status: "选题中", date: "待排期", formats: ["待确定"], owner: "秋", color: "purple",
    }]);
    setDraft("");
    setShowComposer(false);
    setToast("选题已加入待规划队列");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">Q</span><span>QIUQIU<br/>CONTENT ENGINE</span></div>
        <nav aria-label="主导航">
          {["工作台", "内容日历", "选题库", "数据复盘", "内容资产"].map((item) => (
            <button className={activeTab === item ? "nav-item active" : "nav-item"} key={item} onClick={() => setActiveTab(item)}>
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
          <div className="top-actions"><button className="icon-button" aria-label="通知">◌</button><button className="primary-button" onClick={() => setShowComposer(true)}>＋ 新建内容</button></div>
        </header>

        <section className="hero-grid">
          <article className="focus-card">
            <div><span className="section-label">本周焦点</span><h2>AI × 学习成长<br/>转型试水周</h2><p>用一组母内容，完成文章、竖版和横版视频的协同生产。</p></div>
            <div className="focus-footer"><span>进度 3 / 5</span><div className="progress"><i /></div><button>查看计划 →</button></div>
          </article>
          <article className="metric-card"><span>本周待发布</span><strong>{cards.filter((c) => c.status === "待发布").length + 2}</strong><small>内容已进入发布队列</small><div className="mini-bars"><i /><i /><i /><i /><i /></div></article>
          <article className="metric-card accent"><span>历史内容资产</span><strong>484</strong><small>篇文章已可检索复用</small><button onClick={() => setActiveTab("内容资产")}>立即检索 →</button></article>
        </section>

        <section className="section-head"><div><span className="section-label">内容排期</span><h2>这一周怎么排</h2></div><button className="text-button" onClick={() => setActiveTab("内容日历")}>打开月历 →</button></section>
        <section className="week-board" aria-label="本周内容排期">
          {["周一", "周二", "周三", "周四", "周五", "周末"].map((day, index) => {
            const dayCards = cards.filter((card) => card.date === day);
            return <div className={index === 0 ? "day-column today" : "day-column"} key={day}><header><span>{day}</span>{index === 0 && <b>今天</b>}</header>{dayCards.length ? dayCards.map((card) => <article className={`schedule-card ${card.color}`} key={card.id}><small>{card.pillar}</small><h3>{card.title}</h3><div>{card.formats.map((format) => <span key={format}>{format}</span>)}</div></article>) : <button className="empty-slot" onClick={() => setShowComposer(true)}>＋</button>}</div>;
          })}
        </section>

        <section className="lower-grid">
          <article className="kanban-panel"><div className="panel-head"><div><span className="section-label">生产看板</span><h2>卡住的内容，一眼看清</h2></div><span className="hint">点击卡片推进状态</span></div><div className="kanban-columns">{statusOrder.slice(0, 3).map((status) => <div key={status}><h3>{status}<b>{cards.filter((card) => card.status === status).length}</b></h3>{cards.filter((card) => card.status === status).map((card) => <button className="kanban-card" onClick={() => moveCard(card.id)} key={card.id}><i className={card.color} /><span>{card.title}</span><small>{card.owner}</small></button>)}</div>)}</div></article>
          <article className="topic-panel"><span className="section-label">选题助手</span><h2>从历史内容，找到新角度</h2><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试：普通人如何用 AI 学习" /></div><div className="history-list">{filteredHistory.map(([title, tag, date]) => <button key={title} onClick={() => { setDraft(`${title} 的 AI 新版本`); setShowComposer(true); }}><span><b>{title}</b><small>{tag} · {date}</small></span><i>↗</i></button>)}</div><button className="outline-button" onClick={() => setShowComposer(true)}>生成本周新选题</button></article>
        </section>

        <section className="data-strip"><div><span className="section-label">平台数据</span><h2>先看有效内容，再决定下周投入。</h2></div><div className="platform-stats"><span><b>公众号</b><strong>514</strong><small>昨日阅读</small></span><span><b>抖音</b><strong>33.4 万</strong><small>当前粉丝</small></span><span><b>小红书</b><strong>24.3 万</strong><small>当前粉丝</small></span></div><button className="text-button" onClick={() => setToast("平台数据导入会在下一版接入")}>导入数据 →</button></section>
      </section>

      {showComposer && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowComposer(false)}><form className="composer" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); addIdea(); }}><button type="button" className="close" onClick={() => setShowComposer(false)}>×</button><span className="section-label">新建内容</span><h2>先写下一个好选题</h2><label>选题名称<input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="例如：AI 帮我把学习计划做完了" /></label><p>保存后会进入「选题中」，再补齐平台、排期和交付物。</p><button className="primary-button" type="submit">加入内容队列</button></form></div>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
