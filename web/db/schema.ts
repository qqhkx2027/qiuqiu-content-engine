import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contentSchedule = sqliteTable("content_schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  pillar: text("pillar").notNull().default("待归类"),
  status: text("status").notNull().default("选题中"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  platform: text("platform").notNull(),
  owner: text("owner").notNull().default("秋"),
  color: text("color").notNull().default("purple"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const trendItems = sqliteTable("trend_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  externalId: text("external_id").notNull().unique(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull(),
  keyword: text("keyword").notNull(),
  score: integer("score").notNull().default(0),
  publishedAt: text("published_at").notNull(),
  collectedAt: text("collected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_trend_items_score_published").on(table.score, table.publishedAt)]);

export const contentProjects = sqliteTable("content_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  pillar: text("pillar").notNull().default("待归类"),
  audienceProblem: text("audience_problem").notNull().default(""),
  sourceTrendId: integer("source_trend_id"),
  status: text("status").notNull().default("待判断"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contentItems = sqliteTable("content_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("创作中"),
  scheduledAt: text("scheduled_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_content_items_scheduled_at").on(table.scheduledAt), index("idx_content_items_project_id").on(table.projectId)]);

export const performanceRecords = sqliteTable("performance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentItemId: integer("content_item_id").notNull(),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_performance_records_content_item_id").on(table.contentItemId)]);
