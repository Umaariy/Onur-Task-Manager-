CREATE TABLE `password_resets` (
    `token_hash` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `expires_at` integer NOT NULL,
    `used_at` text
);
CREATE INDEX `idx_password_resets_user` ON `password_resets` (`user_id`);
