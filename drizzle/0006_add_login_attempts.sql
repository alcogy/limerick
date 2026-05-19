CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`attempted_at` text NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX `login_attempts_identifier_idx` ON `login_attempts` (`identifier`);
