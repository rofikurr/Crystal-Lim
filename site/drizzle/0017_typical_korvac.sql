ALTER TABLE `orders` ADD `payment_method` varchar(20) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_fee` int DEFAULT 0 NOT NULL;