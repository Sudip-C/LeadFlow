CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`source` text DEFAULT 'Website' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
