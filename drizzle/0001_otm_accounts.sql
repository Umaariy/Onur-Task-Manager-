CREATE TABLE `accounts` (
    `id` text PRIMARY KEY NOT NULL,
    `email` text NOT NULL UNIQUE,
    `password_hash` text NOT NULL,
    `active` integer NOT NULL DEFAULT 1,
    `platform_admin` integer NOT NULL DEFAULT 0,
    `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `idx_initial_platform_admin` ON `accounts` (`platform_admin`) WHERE `platform_admin` = 1;
CREATE TABLE `sessions` (
    `token_hash` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `expires_at` integer NOT NULL,
    `created_at` text NOT NULL
);
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);
