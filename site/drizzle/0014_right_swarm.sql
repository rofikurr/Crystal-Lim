ALTER TABLE `products` ADD `videos` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
UPDATE `products` SET `videos` = JSON_ARRAY(`video`) WHERE `video` <> '';