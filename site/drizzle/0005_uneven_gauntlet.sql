CREATE TABLE `broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`recipient_count` int NOT NULL DEFAULT 0,
	`failed_count` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`unsubscribe_token` varchar(64) NOT NULL,
	`subscribed_at` datetime NOT NULL,
	`unsubscribed_at` datetime,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`),
	CONSTRAINT `newsletter_subscribers_unsubscribe_token_unique` UNIQUE(`unsubscribe_token`)
);
