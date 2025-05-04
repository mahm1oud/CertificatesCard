-- هيكل قاعدة البيانات لمنصة الشهادات الإلكترونية
-- تاريخ الإنشاء: مايو 2025 - الإصدار 1.0.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

--
-- قاعدة البيانات: الشهادات الإلكترونية
--

-- --------------------------------------------------------

--
-- بنية الجدول `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `isAdmin` tinyint(1) DEFAULT 0,
  `profileImage` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `user_preferences`
--

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `theme` varchar(50) DEFAULT 'light',
  `layout` varchar(50) DEFAULT 'boxed',
  `fontSize` varchar(20) DEFAULT 'medium',
  `language` varchar(10) DEFAULT 'ar',
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `categories`
--

CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `displayOrder` int(11) DEFAULT 0,
  `icon` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `templates`
--

CREATE TABLE IF NOT EXISTS `templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `titleAr` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `displayOrder` int(11) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `categoryId` int(11) NOT NULL,
  `imageUrl` varchar(255) NOT NULL,
  `thumbnailUrl` varchar(255) DEFAULT NULL,
  `fields` text,
  `defaultValues` text,
  `settings` text,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `template_fields`
--

CREATE TABLE IF NOT EXISTS `template_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `templateId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT 'text',
  `label` varchar(255) DEFAULT NULL,
  `labelAr` varchar(255) DEFAULT NULL,
  `required` tinyint(1) DEFAULT 0,
  `defaultValue` text,
  `placeholder` varchar(255) DEFAULT NULL,
  `placeholderAr` varchar(255) DEFAULT NULL,
  `imageType` varchar(50) DEFAULT NULL,
  `displayOrder` int(11) DEFAULT 0,
  `position` text NOT NULL,
  `style` text,
  PRIMARY KEY (`id`),
  KEY `templateId` (`templateId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `certificates`
--

CREATE TABLE IF NOT EXISTS `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `titleAr` varchar(255) DEFAULT NULL,
  `templateId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `formData` text,
  `imageUrl` varchar(255) DEFAULT NULL,
  `publicId` varchar(255) DEFAULT NULL,
  `issuedTo` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `issueDate` date DEFAULT NULL,
  `verificationCode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `templateId` (`templateId`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `certificate_views`
--

CREATE TABLE IF NOT EXISTS `certificate_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificateId` int(11) NOT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `userAgent` text,
  `viewedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `certificateId` (`certificateId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `certificate_shares`
--

CREATE TABLE IF NOT EXISTS `certificate_shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificateId` int(11) NOT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `sharedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `certificateId` (`certificateId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `certificate_batches`
--

CREATE TABLE IF NOT EXISTS `certificate_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `templateId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `totalCertificates` int(11) DEFAULT 0,
  `processedCertificates` int(11) DEFAULT 0,
  `filePath` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `templateId` (`templateId`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `seo_settings`
--

CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pageType` varchar(50) NOT NULL,
  `pageId` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `keywords` text,
  `ogImage` varchar(255) DEFAULT NULL,
  `canonicalUrl` varchar(255) DEFAULT NULL,
  `noIndex` tinyint(1) DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_unique` (`pageType`, `pageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `display_settings`
--

CREATE TABLE IF NOT EXISTS `display_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settings` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- إضافة بيانات أولية للجداول
--

-- إدخال فئة افتراضية
INSERT INTO `categories` (`name`, `slug`, `description`, `displayOrder`, `icon`, `active`) VALUES
('دعوات زفاف', 'wedding', 'دعوات زفاف متنوعة', 1, '💍', 1),
('شهادات تقدير', 'appreciation', 'شهادات تقدير للطلاب والموظفين', 2, '🏆', 1),
('بطاقات تهنئة', 'greeting', 'بطاقات تهنئة للمناسبات المختلفة', 3, '🎉', 1),
('بطاقات رمضان', 'ramadan', 'بطاقات وتصاميم شهر رمضان', 4, '🌙', 1);

-- إدخال إعدادات العرض الافتراضية
INSERT INTO `display_settings` (`settings`) VALUES
('{"displayMode":"multi","templateColumns":3,"showFilters":true,"defaultCategory":null,"featuredTemplates":[]}');