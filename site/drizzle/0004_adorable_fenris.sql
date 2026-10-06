CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`label` varchar(40) NOT NULL,
	`recipient_name` varchar(140) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`province` varchar(80) NOT NULL,
	`city` varchar(80) NOT NULL,
	`district` varchar(80) NOT NULL,
	`village` varchar(80) NOT NULL,
	`address` text NOT NULL,
	`postal` varchar(5) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`user_id` int NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `wishlist_items_user_id_product_id_pk` PRIMARY KEY(`user_id`,`product_id`)
);
--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;