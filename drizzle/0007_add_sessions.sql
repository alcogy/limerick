CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	`expires_at` text NOT NULL
);
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
