CREATE TABLE `approval_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`approval_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`decision` text NOT NULL,
	`payload_version` integer NOT NULL,
	`created_at` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `approval_decisions_approval_id_unique` ON `approval_decisions` (`approval_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `approval_decisions_request_id_unique` ON `approval_decisions` (`request_id`);--> statement-breakpoint
CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`actor` text NOT NULL,
	`source_url` text,
	`occurred_at` text,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_time_idx` ON `activity_events` (`recorded_at`);--> statement-breakpoint
CREATE TABLE `instructions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`task_id` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'saved_not_delivered' NOT NULL,
	`created_at` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instructions_request_id_unique` ON `instructions` (`request_id`);--> statement-breakpoint
CREATE TABLE `work_records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
