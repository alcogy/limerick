CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD `line_no` integer DEFAULT 0 NOT NULL;