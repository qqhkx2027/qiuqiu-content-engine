CREATE INDEX `idx_content_items_scheduled_at` ON `content_items` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_content_items_project_id` ON `content_items` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_performance_records_content_item_id` ON `performance_records` (`content_item_id`);--> statement-breakpoint
CREATE INDEX `idx_trend_items_score_published` ON `trend_items` (`score`,`published_at`);