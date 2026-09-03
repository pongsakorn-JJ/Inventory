-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 03, 2026 at 03:52 AM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202688`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `product_id`) VALUES
(1, 2, 1),
(4, 11, 16),
(6, 12, 17);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `old_price` decimal(10,2) DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT '0.0',
  `category` varchar(50) NOT NULL,
  `description` text,
  `location` varchar(255) DEFAULT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `total_stock` int NOT NULL DEFAULT '0',
  `product_status` varchar(20) NOT NULL DEFAULT 'active',
  `image_url` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `badge_status` varchar(20) NOT NULL DEFAULT 'Available',
  `location_count` int NOT NULL DEFAULT '0',
  `location_text` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `brand`, `price`, `old_price`, `rating`, `category`, `description`, `location`, `stock_quantity`, `total_stock`, `product_status`, `image_url`, `created_at`, `updated_at`, `badge_status`, `location_count`, `location_text`) VALUES
(6, 'nindam', 'ORNA', 650.00, 890.00, 5.0, 'Accessories', NULL, 'A1', 0, 5, 'active', 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRIejNfgjOR8ybCRoRcmvZ0V38DrtAuJPbtaRKabkwSzLMUu3hS8zoQuNgooYxFOYrNBEVAYO4Jdq5lvZh59JdfcqcHoDJqNeK6vfpxiqwG2OJ1jhRtbSctT0wv-WPBHndNN6XnsTs&usqp=CAc', '2026-07-28 13:01:11', '2026-09-03 03:33:54', 'Available', 0, NULL),
(26, 'nindam', 'ORNA', 650.00, 890.00, 5.0, 'Accessories', NULL, 'A1', 0, 5, 'active', 'https://raw.githubusercontent.com/pongsakorn-JJ/Inventory/main/product-images/1788406450095-test.jpg', '2026-09-03 03:34:14', '2026-09-03 03:34:14', 'Available', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `receipt_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `receipts`
--

INSERT INTO `receipts` (`id`, `user_id`, `receipt_date`, `total`) VALUES
(1, 2, '2026-07-29 13:41:42', 3590.00),
(2, 4, '2026-07-29 13:51:43', 3590.00),
(3, 4, '2026-08-14 00:21:48', 3590.00),
(4, 4, '2026-08-14 00:49:30', 3590.00),
(5, 4, '2026-08-14 01:55:21', 3590.00),
(6, 4, '2026-08-14 17:15:12', 650.00),
(7, 4, '2026-08-14 17:15:14', 890.00),
(8, 4, '2026-08-14 17:15:15', 1290.00),
(9, 4, '2026-08-14 17:15:17', 5000.00),
(10, 4, '2026-08-14 17:15:19', 1000.00),
(11, 4, '2026-08-14 17:15:20', 3590.00),
(12, 4, '2026-08-14 17:15:22', 1000.00),
(13, 4, '2026-08-14 17:15:23', 5000.00),
(14, 4, '2026-08-14 17:15:27', 890.00),
(15, 4, '2026-08-14 17:15:31', 890.00),
(16, 11, '2026-08-14 17:17:15', 14410.00),
(17, 4, '2026-08-25 21:45:35', 300.00),
(18, 12, '2026-08-25 21:47:30', 300.00),
(19, 4, '2026-08-27 11:39:04', 5000.00);

-- --------------------------------------------------------

--
-- Table structure for table `receipt_items`
--

CREATE TABLE `receipt_items` (
  `id` int NOT NULL,
  `receipt_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `receipt_items`
--

INSERT INTO `receipt_items` (`id`, `receipt_id`, `name`, `price`, `quantity`) VALUES
(1, 1, 'Classic Leather Tote', 3590.00, 1),
(2, 2, 'Classic Leather Tote', 3590.00, 1),
(3, 3, 'Classic Leather Tote', 3590.00, 1),
(4, 4, 'Classic Leather Tote', 3590.00, 1),
(5, 5, 'Classic Leather Tote', 3590.00, 1),
(6, 6, 'Silk Scarf', 650.00, 1),
(7, 7, 'Gold Chain Necklace', 890.00, 1),
(8, 8, 'White Canvas Sneakers', 1290.00, 1),
(9, 9, 'Chanel', 5000.00, 1),
(10, 10, 'jj', 1000.00, 1),
(11, 11, 'Classic Leather Tote', 3590.00, 1),
(12, 12, 'jj', 1000.00, 1),
(13, 13, 'Chanel', 5000.00, 1),
(14, 14, 'Gold Chain Necklace', 890.00, 1),
(15, 15, 'Gold Chain Necklace', 890.00, 1),
(16, 16, 'Classic Leather Tote', 3590.00, 1),
(17, 16, 'Mini Crossbody Bag', 1990.00, 1),
(18, 16, 'White Canvas Sneakers', 1290.00, 1),
(19, 16, 'Gold Chain Necklace', 890.00, 1),
(20, 16, 'Silk Scarf', 650.00, 1),
(21, 16, 'jj', 1000.00, 1),
(22, 16, 'Chanel', 5000.00, 1),
(23, 17, 'test', 300.00, 1),
(24, 18, 'test', 300.00, 1),
(25, 19, 'Chanel', 5000.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`) VALUES
(4, 'admin', 'pongsakorn.sra@ku.th', '$2b$10$5.8t7R3QLjax8v9enqJOGeN6YFqzEKD.CtUzkKmkD.EL75GCGRN5i', 'admin', '2026-07-29 06:50:43'),
(11, 'pongsakorn', 'pongaskorn6767@gmail.com', '$2a$10$.KMmJQ8NP3XWYsP90m7Vyel6LPTrnEHrjqdi9BJEGcvY79mFZLPc.', 'customer', '2026-08-14 10:16:50'),
(12, 'jaY', 'pongsakorn.sra@ku.th', '$2a$10$c4veqNj4plmtgJhdC/6VTe1isoWLy50umqJqvgUyeMQfpn..qKgM2', 'customer', '2026-08-25 14:46:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart_item` (`user_id`,`product_id`),
  ADD KEY `idx_cart_user` (`user_id`),
  ADD KEY `idx_cart_product` (`product_id`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`product_id`),
  ADD KEY `idx_fav_user` (`user_id`),
  ADD KEY `idx_fav_product` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_user` (`user_id`);

--
-- Indexes for table `receipt_items`
--
ALTER TABLE `receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_items_receipt` (`receipt_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `receipt_items`
--
ALTER TABLE `receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
