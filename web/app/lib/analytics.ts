export type Metric = { views: number; likes: number; comments: number; saves: number; shares: number; followers: number };

export function summarizeMetrics(records: Metric[]) {
  const totals = records.reduce((sum, row) => ({
    views: sum.views + Number(row.views), likes: sum.likes + Number(row.likes),
    comments: sum.comments + Number(row.comments), saves: sum.saves + Number(row.saves),
    shares: sum.shares + Number(row.shares), followers: sum.followers + Number(row.followers),
  }), { views: 0, likes: 0, comments: 0, saves: 0, shares: 0, followers: 0 });
  const interactions = totals.likes + totals.comments + totals.saves + totals.shares;
  return { ...totals, interactions, engagementRate: totals.views ? interactions / totals.views : 0 };
}
