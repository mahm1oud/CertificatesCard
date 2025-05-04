/**
 * تصدير مكونات محرر القوالب
 * تم التحديث: مايو 2025
 * 
 * هذا الملف يصدر جميع مكونات محرر القوالب ليتم استيرادها من مكان واحد
 * كما يضمن التوافقية الخلفية مع الكود القديم عبر تصدير المكونات القديمة والجديدة
 */

// تصدير المكونات المحسنة كمكونات قياسية
export { DraggableFieldsPreviewEnhanced as DraggableFieldsPreview } from './DraggableFieldsPreviewEnhanced2';
export { AdvancedTemplateEditor as TemplateEditor } from './AdvancedTemplateEditor';

// تصدير المكونات للتوافقية الخلفية
export { default as DraggableFieldsPreviewEnhanced } from './DraggableFieldsPreviewEnhanced2';
export { default as AdvancedTemplateEditor } from './AdvancedTemplateEditor';

// للتوافقية الخلفية مع الكود القديم، نصدر المكون المحسن تحت كل الأسماء المستخدمة سابقًا
export { DraggableFieldsPreviewEnhanced as DraggableFieldsPreviewUnified } from './DraggableFieldsPreviewEnhanced2';
export { DraggableFieldsPreviewEnhanced as DraggableFieldsPreviewPro } from './DraggableFieldsPreviewEnhanced2';
export { DraggableFieldsPreviewEnhanced as DraggableFieldsPreviewPro2 } from './DraggableFieldsPreviewEnhanced2';
export { FieldOptionsEditor } from './FieldOptionsEditor';

// ملاحظة: أصبح المكون DraggableFieldsPreviewEnhanced هو المكون القياسي المستخدم في التطبيق
// ويحتوي على جميع الميزات المتقدمة المطلوبة مع ضمان التطابق 100% مع مولد الصور