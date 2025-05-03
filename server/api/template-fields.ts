/**
 * واجهة برمجة التطبيق للتعامل مع حقول القوالب
 * 
 * هذا الملف يوفر واجهة برمجية للتعامل مع حقول القوالب (إضافة، تعديل، حذف)
 * مع دعم خاصية الطبقات (zIndex) وترتيبها
 */
import { Request, Response } from 'express';
import { storage } from '../storage';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { templateFields } from '@shared/schema';
import { withDatabaseRetry } from '../db';

/**
 * الحصول على حقول قالب معين
 */
export async function getTemplateFields(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف القالب غير صالح'
      });
    }
    
    console.log(`Fetching fields for template ID: ${templateId}`);
    
    const fields = await storage.getTemplateFields(Number(templateId));
    
    res.json({
      success: true,
      fields
    });
  } catch (error) {
    console.error('Error fetching template fields:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء جلب حقول القالب' 
    });
  }
}

/**
 * تحديث حقول القالب (إضافة، تعديل، حذف)
 * يدعم التحديث الجماعي للحقول وخصائص الطبقات (zIndex)
 */
export async function updateTemplateFields(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const { fields } = req.body;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف القالب غير صالح'
      });
    }
    
    if (!Array.isArray(fields)) {
      return res.status(400).json({ 
        success: false, 
        message: 'يجب تقديم مصفوفة من الحقول'
      });
    }
    
    console.log(`Updating ${fields.length} fields for template ID: ${templateId}`);
    
    // معالجة كل حقل بشكل منفصل
    const updatedFields = [];
    
    for (const field of fields) {
      // إذا كان الحقل له معرف، فهذا يعني أنه موجود بالفعل وسيتم تحديثه
      if (field.id && !isNaN(Number(field.id))) {
        // تحديث الحقل
        const updatedField = await storage.updateTemplateField(Number(field.id), {
          name: field.name,
          type: field.type,
          label: field.label,
          labelAr: field.labelAr,
          required: field.required,
          defaultValue: field.defaultValue,
          placeholder: field.placeholder,
          placeholderAr: field.placeholderAr,
          options: field.options,
          position: field.position,
          style: field.style,
          displayOrder: field.displayOrder,
          // إضافة دعم للخصائص الجديدة
          zIndex: field.zIndex,
          visible: field.visible !== undefined ? field.visible : true,
          rotation: field.rotation || 0
        });
        
        updatedFields.push(updatedField);
      } else if (!field.id) {
        // إنشاء حقل جديد
        const newField = await storage.createTemplateField({
          name: field.name,
          type: field.type || 'text',
          label: field.label,
          labelAr: field.labelAr,
          required: Boolean(field.required),
          defaultValue: field.defaultValue,
          placeholder: field.placeholder,
          placeholderAr: field.placeholderAr,
          options: field.options || [],
          position: field.position || { x: 50, y: 50 },
          style: field.style || {
            fontFamily: 'Cairo',
            fontSize: 24,
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            verticalPosition: 'middle'
          },
          displayOrder: field.displayOrder || 0,
          templateId: Number(templateId),
          // إضافة دعم للخصائص الجديدة
          zIndex: field.zIndex || 1,
          visible: field.visible !== undefined ? field.visible : true,
          rotation: field.rotation || 0
        });
        
        updatedFields.push(newField);
      }
    }
    
    res.json({
      success: true,
      message: 'تم تحديث الحقول بنجاح',
      fields: updatedFields
    });
  } catch (error) {
    console.error('Error updating template fields:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء تحديث حقول القالب' 
    });
  }
}

/**
 * حذف حقل من القالب
 */
export async function deleteTemplateField(req: Request, res: Response) {
  try {
    const { templateId, fieldId } = req.params;
    
    if (!templateId || isNaN(Number(templateId)) || !fieldId || isNaN(Number(fieldId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف القالب أو معرف الحقل غير صالح'
      });
    }
    
    console.log(`Deleting field ID: ${fieldId} from template ID: ${templateId}`);
    
    // التحقق من وجود الحقل وأنه ينتمي للقالب المحدد
    const field = await withDatabaseRetry(async () => {
      const result = await db
        .select()
        .from(templateFields)
        .where(
          and(
            eq(templateFields.id, Number(fieldId)),
            eq(templateFields.templateId, Number(templateId))
          )
        );
      return result[0];
    });
    
    if (!field) {
      return res.status(404).json({ 
        success: false, 
        message: 'الحقل غير موجود أو لا ينتمي للقالب المحدد'
      });
    }
    
    // حذف الحقل
    await storage.deleteTemplateField(Number(fieldId));
    
    res.json({
      success: true,
      message: 'تم حذف الحقل بنجاح'
    });
  } catch (error) {
    console.error('Error deleting template field:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء حذف حقل القالب' 
    });
  }
}