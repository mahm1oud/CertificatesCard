import express, { Request, Response } from 'express';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { isAuthenticated } from '../auth';
import { generateOptimizedCardImage } from '../optimized-image-generator';
import sharp from 'sharp';

const router = express.Router();

// رفع صورة جديدة للبطاقة - تم تحسين الأداء وسرعة المعالجة
router.post('/:id/update-image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageData, quality = 'preview' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: "لا توجد بيانات صورة مرسلة" });
    }
    
    // جلب البطاقة
    const card = await storage.getCard(parseInt(id));
    if (!card) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }
    
    // تحقق من الصلاحيات إذا كان المستخدم مسجل
    if (req.isAuthenticated() && card.userId && req.user.id !== card.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "غير مصرح لك بتعديل هذه البطاقة" });
    }
    
    // معالجة بيانات base64
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // إنشاء مجلدات الحفظ مع دعم التصنيف حسب الجودة
    const uploadDir = path.join(process.cwd(), 'uploads');
    const generatedDir = path.join(uploadDir, 'generated');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.mkdir(generatedDir, { recursive: true });
    
    // تحسين تسمية الملفات بإضافة الجودة للتمييز والتخزين المؤقت
    const timestamp = Date.now();
    const filename = `card_${id}_${timestamp}_${quality}.png`;
    const uploadPath = path.join(generatedDir, filename);
    
    // تحسين: استخدام sharp لضغط الصورة وتحسين الأداء
    try {
      // استيراد مكتبة sharp بشكل ديناميكي لتحسين الأداء
      const sharp = require('sharp');
      
      // تطبيق ضغط مختلف حسب مستوى الجودة المطلوب
      let optimizedBuffer;
      if (quality === 'preview' || quality === 'low') {
        // جودة منخفضة للعرض السريع
        optimizedBuffer = await sharp(buffer)
          .resize({ width: 800, withoutEnlargement: true, fastShrinkOnLoad: true })
          .webp({ quality: quality === 'preview' ? 65 : 75 })
          .toBuffer();
      } else if (quality === 'medium') {
        // جودة متوسطة
        optimizedBuffer = await sharp(buffer)
          .jpeg({ quality: 85 })
          .toBuffer();
      } else {
        // جودة عالية للتنزيل
        optimizedBuffer = await sharp(buffer)
          .png({ compressionLevel: 6 })
          .toBuffer();
      }
      
      // كتابة الملف المحسن
      await fs.promises.writeFile(uploadPath, optimizedBuffer);
    } catch (sharpError) {
      console.error("Error optimizing image with sharp:", sharpError);
      // في حالة فشل المعالجة، نستخدم الصورة الأصلية
      await fs.promises.writeFile(uploadPath, buffer);
    }
    
    // محاولة حذف الصورة القديمة
    if (card.imageUrl) {
      const oldImagePath = path.join(process.cwd(), card.imageUrl.replace(/^\//, ''));
      try {
        await fs.promises.access(oldImagePath, fs.constants.F_OK);
        await fs.promises.unlink(oldImagePath);
      } catch (error) {
        console.warn(`Old image at ${oldImagePath} could not be deleted:`, error);
      }
    }
    
    // تحديث البطاقة مع عنوان URL الجديد للصورة
    const imageUrl = `/uploads/generated/${filename}`;
    await storage.updateCard(card.id, { imageUrl, quality });
    
    res.json({ 
      success: true, 
      imageUrl, 
      quality,
      message: "تم تحديث صورة البطاقة بنجاح" 
    });
  } catch (error) {
    console.error("Error updating card image:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث صورة البطاقة" });
  }
});

// تحديث تصميم البطاقة (مواضع وخصائص الحقول)
router.patch('/:id/update-design', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;
    
    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ message: "بيانات الحقول غير صالحة" });
    }
    
    // جلب البطاقة
    const card = await storage.getCard(parseInt(id));
    if (!card) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }
    
    // تحقق من الصلاحيات إذا كان المستخدم مسجل
    if (req.isAuthenticated() && card.userId && req.user.id !== card.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "غير مصرح لك بتعديل هذه البطاقة" });
    }
    
    // تحضير بيانات التحديث - نحتفظ بالبيانات المدخلة ونضيف بيانات التصميم
    let updatedFormData = { ...card.formData };
    
    // إضافة/تحديث حقل خاص يحتوي على بيانات التصميم المخصص
    updatedFormData._designFields = fields;
    
    // تحديث البطاقة مع بيانات التصميم الجديدة
    await storage.updateCard(card.id, { formData: updatedFormData });
    
    res.json({ 
      success: true, 
      message: "تم تحديث تصميم البطاقة بنجاح"
    });
  } catch (error) {
    console.error("Error updating card design:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث تصميم البطاقة" });
  }
});

// نهاية جديدة للتنزيل مع دعم الجودة المختلفة
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quality = 'high' } = req.body;
    
    // تحويل النوع إلى الأنواع المدعومة
    const validQuality = ['preview', 'low', 'medium', 'high', 'download'].includes(quality as string) 
      ? quality as 'preview' | 'low' | 'medium' | 'high' | 'download'
      : 'high';
    
    console.log(`Processing download request for card ID: ${id} with quality: ${validQuality}`);
    
    // جلب البطاقة
    const card = await storage.getCard(parseInt(id));
    if (!card) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }
    
    // استخراج القالب والبيانات
    const template = await storage.getTemplate(card.templateId);
    if (!template) {
      return res.status(404).json({ message: "القالب غير موجود" });
    }
    
    // استخراج حقول القالب
    const templateFields = template.fields || [];
    
    // بيانات النموذج: إما من البطاقة أو افتراضيًا فارغة
    const formData = card.formData || {};
    
    // إعدادات الإخراج
    const templateSettings = template.settings || {};
    const outputWidth = templateSettings.width ? parseInt(templateSettings.width) : 1200;
    const outputHeight = templateSettings.height ? parseInt(templateSettings.height) : 1600;
    
    console.log(`Generating download image with dimensions: ${outputWidth}x${outputHeight}`);
    
    // الحقول المستخدمة للإخراج: استخدام الحقول المخصصة إذا كانت موجودة
    const fieldsToUse = formData._designFields || templateFields;
    
    // توليد صورة بجودة عالية
    const imagePath = await generateOptimizedCardImage({
      templatePath: template.imageUrl,
      fields: fieldsToUse,
      formData,
      quality: validQuality,
      outputWidth,
      outputHeight,
      outputFormat: validQuality === 'download' ? 'png' : 'jpeg'
    });
    
    // استخراج عنوان URL النسبي
    const imageUrl = `/uploads/generated/${path.basename(imagePath)}`;
    
    // تحديث البطاقة مع آخر نسخة من الصورة إذا كانت جودة "عالية"
    if (validQuality === 'high' || validQuality === 'download') {
      await storage.updateCard(card.id, { 
        imageUrl,
        lastDownloaded: new Date()
      });
    }
    
    console.log(`Download image generated: ${imageUrl}`);
    
    res.json({
      success: true,
      imageUrl,
      quality: validQuality,
      message: "تم توليد صورة التنزيل بنجاح"
    });
    
  } catch (error) {
    console.error("Error generating download image:", error);
    res.status(500).json({
      message: "حدث خطأ أثناء توليد صورة التنزيل",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;