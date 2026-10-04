CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(64) NOT NULL,
	`product_id` varchar(64) NOT NULL,
	`product_name` varchar(140) NOT NULL,
	`product_image` varchar(800) NOT NULL,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(64) NOT NULL,
	`customer_name` varchar(140) NOT NULL,
	`customer_email` varchar(255) NOT NULL,
	`customer_phone` varchar(32) NOT NULL,
	`shipping_address` text NOT NULL,
	`notes` varchar(200) NOT NULL DEFAULT '',
	`subtotal` int NOT NULL,
	`shipping_fee` int NOT NULL,
	`total` int NOT NULL,
	`status` enum('pending','paid','shipped','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
	`xendit_invoice_id` varchar(120) NOT NULL DEFAULT '',
	`xendit_invoice_url` varchar(800) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;