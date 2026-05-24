CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL DEFAULT '',
	`body` text NOT NULL DEFAULT '',
	`updated_at` text NOT NULL DEFAULT (datetime('now'))
);
