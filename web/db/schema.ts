import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
