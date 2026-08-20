CREATE TABLE `content_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`pillar` text DEFAULT '待归类' NOT NULL,
	`status` text DEFAULT '选题中' NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`platform` text NOT NULL,
	`owner` text DEFAULT '秋' NOT NULL,
	`color` text DEFAULT 'purple' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
