-- إضافة التصنيفات الافتراضية

INSERT INTO categories (name, name_ar, slug, description, description_ar, display_order, icon, active)
VALUES
('Wedding Invitations', 'دعوات زفاف', 'wedding', 'Various wedding invitation templates', 'دعوات زفاف متنوعة', 1, '💍', true),
('Engagement Invitations', 'دعوات خطوبة', 'engagement', 'Various engagement invitation templates', 'دعوات خطوبة متنوعة', 2, '💑', true),
('Graduation Cards', 'تهنئة تخرج', 'graduation', 'Graduation certificates and cards', 'شهادات وبطاقات تخرج', 3, '🎓', true),
('Eid Cards', 'بطاقات عيد', 'eid', 'Eid al-Fitr and Eid al-Adha cards', 'بطاقات عيد الفطر والأضحى', 4, '🎉', true),
('Ramadan Cards', 'بطاقات رمضانية', 'ramadan', 'Ramadan Kareem greeting cards', 'بطاقات تهنئة رمضان كريم', 5, '🌙', true),
('Certificates', 'شهادات شكر وتقدير', 'certificates', 'Various appreciation and recognition certificates', 'شهادات شكر وتقدير متنوعة', 6, '📜', true),
('Other', 'أخرى', 'other', 'Other template types', 'أنواع قوالب أخرى', 7, '📁', true)
ON CONFLICT (slug) DO NOTHING;
