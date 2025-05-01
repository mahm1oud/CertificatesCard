/**
 * تصدير مكونات محرر القوالب
 * تم التحديث: مايو 2025
 * 
 * هذا الملف يصدر جميع مكونات محرر القوالب ليتم استيرادها من مكان واحد
 * كما يضمن التوافقية الخلفية مع الكود القديم عبر تصدير المكونات القديمة والجديدة
 */

// تصدير المكونات الموحدة الجديدة
export { DraggableFieldsPreviewUnified as DraggableFieldsPreview } from './DraggableFieldsPreviewUnified';
export { AdvancedTemplateEditor as TemplateEditor } from './AdvancedTemplateEditor';

// تصدير المكونات للتوافقية الخلفية مع الكود القديم
export { default as DraggableFieldsPreviewUnified } from './DraggableFieldsPreviewUnified';
export { default as AdvancedTemplateEditor } from './AdvancedTemplateEditor';

// تصدير المكونات القديمة بأسمائها الأصلية للتوافقية الخلفية
export { DraggableFieldsPreviewPro } from './DraggableFieldsPreviewPro';
export { DraggableFieldsPreviewPro2 } from './DraggableFieldsPreviewPro2';

// ملاحظة: نستخدم DraggableFieldsPreviewPro كنسخة افتراضية قديمة للتوافقية مع الكود الموجود
// وسيتم استبدالها تدريجياً بالنسخة الموحدة الجديدة