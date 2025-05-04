-- ملف الهيكل الأساسي لقاعدة بيانات MySQL
-- يستخدم هذا الملف لإنشاء جداول قاعدة البيانات للتطبيق

-- حذف الجداول إذا كانت موجودة مسبقًا (للتثبيت النظيف)
SET FOREIGN_KEY_CHECKS = 0;

-- جدول المستخدمين
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `firstName` VARCHAR(255),
  `lastName` VARCHAR(255),
  `profilePicture` VARCHAR(255),
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول الفئات
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `display_order` INT DEFAULT 0,
  `icon` VARCHAR(50),
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول القوالب
DROP TABLE IF EXISTS `templates`;
CREATE TABLE `templates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255),
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `category_id` INT NOT NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `thumbnail_url` VARCHAR(1000),
  `display_order` INT DEFAULT 0,
  `fields` JSON,
  `default_values` JSON,
  `settings` JSON,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
);

-- جدول حقول القوالب
DROP TABLE IF EXISTS `template_fields`;
CREATE TABLE `template_fields` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `template_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `label_ar` VARCHAR(255),
  `type` VARCHAR(50) NOT NULL DEFAULT 'text',
  `position` JSON NOT NULL,
  `style` JSON,
  `default_value` TEXT,
  `required` BOOLEAN NOT NULL DEFAULT FALSE,
  `display_order` INT DEFAULT 0,
  `placeholder` VARCHAR(255),
  `placeholder_ar` VARCHAR(255),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
);

-- جدول الشهادات
DROP TABLE IF EXISTS `certificates`;
CREATE TABLE `certificates` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255),
  `image_url` VARCHAR(1000) NOT NULL,
  `template_id` INT NOT NULL,
  `user_id` INT,
  `certificate_type` VARCHAR(50) NOT NULL DEFAULT 'appreciation',
  `form_data` JSON,
  `issued_to` VARCHAR(255),
  `issued_to_gender` VARCHAR(50),
  `issued_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` DATE,
  `verification_code` VARCHAR(50) UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `batch_id` INT,
  `public_id` VARCHAR(100) UNIQUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- جدول الدفعات
DROP TABLE IF EXISTS `batches`;
CREATE TABLE `batches` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `template_id` INT NOT NULL,
  `user_id` INT,
  `file_path` VARCHAR(1000),
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `total_count` INT DEFAULT 0,
  `processed_count` INT DEFAULT 0,
  `error_count` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- جدول اللوجوهات
DROP TABLE IF EXISTS `logos`;
CREATE TABLE `logos` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `user_id` INT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- جدول التوقيعات
DROP TABLE IF EXISTS `signatures`;
CREATE TABLE `signatures` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `user_id` INT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- جدول إعدادات العرض
DROP TABLE IF EXISTS `display_settings`;
CREATE TABLE `display_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `settings` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول تفضيلات المستخدم
DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT UNIQUE,
  `theme` VARCHAR(50) DEFAULT 'light',
  `layout` VARCHAR(50) DEFAULT 'boxed',
  `language` VARCHAR(10) DEFAULT 'ar',
  `settings` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- جدول جلسات المستخدمين
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `sid` VARCHAR(255) NOT NULL PRIMARY KEY,
  `sess` JSON NOT NULL,
  `expired` TIMESTAMP(6) NOT NULL,
  INDEX `sessions_expired_idx` (`expired`)
);

SET FOREIGN_KEY_CHECKS = 1;