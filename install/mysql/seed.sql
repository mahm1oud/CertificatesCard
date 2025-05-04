-- ملف البيانات الأولية للتطبيق
-- يستخدم هذا الملف لإضافة البيانات الأساسية إلى قاعدة البيانات بعد إنشائها

-- إضافة مستخدم الأدمن الافتراضي
-- كلمة المرور الافتراضية: 700700
INSERT INTO `users` (`username`, `email`, `password`, `role`, `active`)
VALUES ('admin', 'admin@example.com', '$2a$10$lO4OiGsJz.pTUwlzfqD8yeh9xMSKwALjUZdTZKaBjJXn7yHRBqASK', 'admin', TRUE)
ON DUPLICATE KEY UPDATE 
  `password` = '$2a$10$lO4OiGsJz.pTUwlzfqD8yeh9xMSKwALjUZdTZKaBjJXn7yHRBqASK',
  `role` = 'admin',
  `active` = TRUE;

-- إضافة الفئات الافتراضية
INSERT INTO `categories` (`name`, `slug`, `description`, `display_order`, `icon`, `active`)
VALUES 
  ('دعوات زفاف', 'wedding', 'دعوات زفاف متنوعة', 1, '💍', TRUE),
  ('شهادات تقدير', 'appreciation', 'شهادات تقدير واعتراف بالجهود', 2, '🏆', TRUE),
  ('شهادات تعليمية', 'education', 'شهادات للمناسبات التعليمية والأكاديمية', 3, '🎓', TRUE),
  ('شهادات تدريب', 'training', 'شهادات لإتمام الدورات التدريبية', 4, '📚', TRUE),
  ('بطاقات الأعمال', 'business', 'بطاقات أعمال احترافية', 5, '💼', TRUE),
  ('بطاقات تهنئة', 'greeting', 'بطاقات تهنئة للمناسبات المختلفة', 6, '🎉', TRUE),
  ('أخرى', 'other', 'قوالب متنوعة أخرى', 7, '📄', TRUE)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `display_order` = VALUES(`display_order`),
  `icon` = VALUES(`icon`),
  `active` = TRUE;

-- إضافة قالب شهادة افتراضي للعرض
INSERT INTO `templates` (`title`, `title_ar`, `slug`, `category_id`, `image_url`, `thumbnail_url`, `display_order`, `fields`, `default_values`, `settings`, `active`)
VALUES 
  ('شهادة تقدير أساسية', 'شهادة تقدير أساسية', 'basic-appreciation', 2, '/static/templates/appreciation-default.jpg', '/static/templates/appreciation-default-thumb.jpg', 1, '[]', '{}', '{"paperSize": "A4", "orientation": "landscape"}', TRUE),
  ('شهادة إنجاز تقني', 'شهادة إنجاز تقني', 'tech-achievement', 7, '/static/templates/tech-achievement.jpg', '/static/templates/tech-achievement-thumb.jpg', 1, '[]', '{}', '{"paperSize": "A4", "orientation": "landscape"}', TRUE),
  ('شهادة حضور دورة تسويق', 'شهادة حضور دورة تسويق', 'marketing-course', 4, '/static/templates/marketing-course.jpg', '/static/templates/marketing-course-thumb.jpg', 1, '[]', '{}', '{"paperSize": "A4", "orientation": "landscape"}', TRUE)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `title_ar` = VALUES(`title_ar`),
  `image_url` = VALUES(`image_url`),
  `thumbnail_url` = VALUES(`thumbnail_url`),
  `category_id` = VALUES(`category_id`),
  `display_order` = VALUES(`display_order`),
  `settings` = VALUES(`settings`),
  `active` = TRUE;

-- إعدادات العرض الافتراضية
INSERT INTO `display_settings` (`settings`)
VALUES ('{"displayMode": "multi", "templateSize": "medium", "enableFilters": true}')
ON DUPLICATE KEY UPDATE
  `settings` = VALUES(`settings`);

-- تفضيلات المستخدم الافتراضية للأدمن
INSERT INTO `user_preferences` (`user_id`, `theme`, `layout`, `language`)
SELECT id, 'light', 'boxed', 'ar' FROM `users` WHERE `username` = 'admin'
ON DUPLICATE KEY UPDATE
  `theme` = 'light',
  `layout` = 'boxed',
  `language` = 'ar';