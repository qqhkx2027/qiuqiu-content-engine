CREATE TABLE `content_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`platform` text NOT NULL,
	`status` text DEFAULT '创作中' NOT NULL,
	`scheduled_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`pillar` text DEFAULT '待归类' NOT NULL,
	`audience_problem` text DEFAULT '' NOT NULL,
	`source_trend_id` integer,
	`status` text DEFAULT '待判断' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `performance_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_item_id` integer NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`followers` integer DEFAULT 0 NOT NULL,
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trend_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`keyword` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`published_at` text NOT NULL,
	`collected_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trend_items_external_id_unique` ON `trend_items` (`external_id`);