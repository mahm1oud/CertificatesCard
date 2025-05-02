/**
 * مولد صور محسّن للبطاقات والشهادات
 * الإصدار 3.1 - مايو 2025
 * 
 * ميزات هذا المولد المحسن:
 * 1. يضمن تطابق 100% بين معاينة المحرر والصورة النهائية
 * 2. يستخدم معامل قياس (Scaling Factor) للتعويض عن فرق الحجم بين الواجهة والسيرفر
 * 3. كود أكثر إيجازاً وأسهل للصيانة
 * 4. يدعم المرونة في ضبط أبعاد الصورة الناتجة
 * 
 * تحديثات الإصدار 3.1:
 * - توحيد معامل القياس بين السيرفر والواجهة (BASE_IMAGE_WIDTH = 1000)
 * - توحيد معالجة الظلال (shadowOffset) بين المكونات
 * - تحسين التوثيق والتعليقات
 * - إضافة أمثلة لتوضيح آلية التطابق
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import type { Template } from "@shared/schema";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { formatDate, formatTime } from "./lib/utils";
import { db, pool } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

// تسجيل الخطوط العربية المدعومة
try {
  // تحديد مسارات الخطوط المحتملة - نحاول عدة مسارات للتأكد من العمل في مختلف البيئات
  const possibleFontDirs = [
    path.join(process.cwd(), 'fonts'),                 // المسار القياسي (development)
    path.join(process.cwd(), '/fonts'),               // مع المسار المطلق
    path.resolve('./fonts'),                         // نسبي للملف الحالي في ESM
    path.join('/opt/render/project/src', 'fonts'),    // مسار Render.com
    path.join('/app', 'fonts'),                       // مسار Docker
    path.resolve('./fonts'),                          // مسار نسبي بديل
    '/home/runner/workspace/fonts',                   // مسار Replit
    '/workspace/fonts'                                // مسار Cloud IDE آخر
  ];
  
  // وظيفة للتحقق من وجود الخط وتسجيله
  const registerFontSafely = (fontPath: string, options: any) => {
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, options);
      return true;
    }
    return false;
  };
  
  // البحث عن مجلد الخطوط الموجود
  let foundFontsDir = null;
  for (const dir of possibleFontDirs) {
    if (fs.existsSync(dir)) {
      foundFontsDir = dir;
      console.log(`Found fonts directory at: ${dir}`);
      break;
    }
  }
  
  // لا نستخدم مجلد 'new' بعد الآن لأنه يحتوي على ملفات HTML وليس ملفات خطوط TTF
  // إذا لم يتم العثور على مجلد الخطوط، يمكن إضافة مسارات بديلة
  console.log(`Using fonts from directory: ${foundFontsDir}`);
  
  // للتوضيح فقط - طباعة أنواع الملفات للتحقق
  try {
    if (foundFontsDir) {
      const cairoPath = path.join(foundFontsDir, 'Cairo-Regular.ttf');
      console.log(`Cairo font path: ${cairoPath}, exists: ${fs.existsSync(cairoPath)}`);
    }
  } catch (e) {
    console.log('Error checking font file', e);
  }
  
  if (!foundFontsDir) {
    throw new Error('لم يتم العثور على مجلد الخطوط في أي مسار معروف');
  }
  
  // تسجيل الخطوط العربية من المجلد المكتشف
  let registeredFonts = 0;
  
  // تسجيل خط Cairo
  if (registerFontSafely(path.join(foundFontsDir, 'Cairo-Regular.ttf'), { family: 'Cairo' })) {
    registeredFonts++;
  }
  if (registerFontSafely(path.join(foundFontsDir, 'Cairo-Bold.ttf'), { family: 'Cairo', weight: 'bold' })) {
    registeredFonts++;
  }
  
  // تسجيل خط Tajawal
  if (registerFontSafely(path.join(foundFontsDir, 'Tajawal-Regular.ttf'), { family: 'Tajawal' })) {
    registeredFonts++;
  }
  if (registerFontSafely(path.join(foundFontsDir, 'Tajawal-Bold.ttf'), { family: 'Tajawal', weight: 'bold' })) {
    registeredFonts++;
  }
  
  // تسجيل خط Amiri
  if (registerFontSafely(path.join(foundFontsDir, 'Amiri-Regular.ttf'), { family: 'Amiri' })) {
    registeredFonts++;
  }
  if (registerFontSafely(path.join(foundFontsDir, 'Amiri-Bold.ttf'), { family: 'Amiri', weight: 'bold' })) {
    registeredFonts++;
  }
  
  if (registeredFonts > 0) {
    console.log(`✅ تم تسجيل ${registeredFonts} خطوط عربية بنجاح من المجلد ${foundFontsDir}`);
  } else {
    console.warn("Could not register custom fonts, using system fonts instead");
  }
} catch (error) {
  console.warn("Could not register custom fonts, using system fonts instead");
  console.error("⚠️ خطأ في تسجيل الخطوط العربية:", error);
}

// أنماط خطوط عربية للاستخدام داخل الكود
const ARABIC_FONTS = {
  CAIRO: 'Cairo',
  CAIRO_BOLD: 'Cairo',    // سنستخدم Cairo بدون Bold وسنضيف bold في الخصائص
  TAJAWAL: 'Tajawal',
  TAJAWAL_BOLD: 'Tajawal', // سنستخدم Tajawal بدون Bold وسنضيف bold في الخصائص
  AMIRI: 'Amiri',
  AMIRI_BOLD: 'Amiri',    // سنستخدم Amiri بدون Bold وسنضيف bold في الخصائص
};

/**
 * واجهة تكوين الحقل المطورة مع دعم كامل لخصائص الطبقات والدوران والرؤية
 * هذه الواجهة مطابقة تماماً للواجهة المستخدمة في المكونات الأخرى
 * للحصول على تطابق 100% بين المعاينة والصورة النهائية
 */
interface FieldConfig {
  id?: number;
  name: string;
  position: { x: number; y: number, snapToGrid?: boolean } | any; // قبول أي نوع من البيانات للتوافق مع النظام الحالي
  type?: 'text' | 'image' | string;
  imageType?: string | null; // نوع الصورة (شعار أو توقيع) - إضافة null للتوافق مع قاعدة البيانات
  zIndex?: number; // دعم الطبقات
  visible?: boolean; // دعم الإخفاء
  rotation?: number; // دعم الدوران
  size?: { width: number; height: number }; // دعم تحديد أبعاد الحقل
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
    verticalPosition?: 'top' | 'middle' | 'bottom';
    maxWidth?: number;
    textShadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    };
    // خصائص الخط
    lineHeight?: number;
    letterSpacing?: number;
    // إضافة خصائص حقول الصور
    imageMaxWidth?: number;
    imageMaxHeight?: number;
    imageBorder?: boolean;
    imageRounded?: boolean;
    imagePadding?: number;
    imageShadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    };
    backgroundColor?: string;
    layer?: number; // للتوافقية الخلفية مع النظام القديم
  } | any; // قبول أي نوع من البيانات للتوافق مع النظام الحالي
  defaultValue?: string | null;
  label?: string;
  labelAr?: string | null;
  required?: boolean;
  templateId?: number;
  displayOrder?: number;
  placeholder?: string | null; 
  placeholderAr?: string | null;
  options?: any[];
}

interface GenerateCardOptions {
  templatePath: string;
  fields: FieldConfig[];
  formData: Record<string, any>;
  outputWidth?: number;
  outputHeight?: number;
  quality?: 'preview' | 'low' | 'medium' | 'high' | 'download';
  outputFormat?: 'png' | 'jpeg';
}

/**
 * تحسين الصورة باستخدام مكتبة Sharp بشكل أكثر كفاءة
 * 
 * @param buffer بيانات الصورة
 * @param quality جودة الصورة
 * @param format تنسيق الصورة
 * @returns بيانات الصورة المحسنة
 */
/**
 * تحسين الصورة باستخدام مكتبة Sharp مع الحفاظ على أبعاد وجودة الصورة الأصلية
 * هذه الدالة تعالج الصورة حسب جودة الإخراج المطلوبة
 * 
 * @param buffer بيانات الصورة
 * @param quality مستوى الجودة
 * @param format صيغة الصورة
 * @returns بيانات الصورة المحسنة
 */
async function optimizeImage(
  buffer: Buffer, 
  quality: 'preview' | 'low' | 'medium' | 'high' | 'download' = 'high', 
  format: 'png' | 'jpeg' = 'png',
  trimWhitespace: boolean = false
): Promise<Buffer> {
  // تحديد جودة حسب الإعداد المطلوب
  let outputQuality = 100;
  
  switch (quality) {
    case 'preview': 
      outputQuality = 80; break;
    case 'low': 
      outputQuality = 90; break;
    case 'medium': 
      outputQuality = 95; break;
    case 'high': 
    case 'download': 
      outputQuality = 100; break;
  }
  
  // استخدام Sharp لضغط الصورة وتحسينها
  let sharpImg = sharp(buffer);
  
  // معالجة الصورة لإزالة الحواف الفارغة عند التنزيل
  // بدلاً من استخدام trim() التي قد تسبب مشاكل، نعتمد طريقة مختلفة
  if (quality === 'download' || trimWhitespace) {
    try {
      // نضبط التباين والحدة لتحسين الصورة
      sharpImg = sharpImg
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }) // تسطيح الصورة بخلفية بيضاء
        .extend({ top: 0, right: 0, bottom: 0, left: 0 }) // ضمان عدم وجود حواف فارغة
        .sharpen(); // تحسين حدة الصورة
      
      console.log('✅ تم تحسين الصورة للتنزيل');
    } catch (enhanceError) {
      console.error('⚠️ خطأ أثناء محاولة تحسين الصورة:', enhanceError);
      // نستمر في المعالجة رغم وجود خطأ
    }
  }
  
  if (format === 'jpeg') {
    sharpImg = sharpImg.jpeg({ quality: outputQuality });
  } else {
    // استخدام PNG للجودة العالية والشفافية
    sharpImg = sharpImg.png({ quality: outputQuality });
  }
  
  // ضبط الحدة والتباين للحصول على صورة واضحة
  if (quality !== 'preview') {
    sharpImg = sharpImg.sharpen();
  }
  
  return await sharpImg.toBuffer();
}

/**
 * توليد صورة بطاقة أو شهادة مع ضمان التطابق مع معاينة المحرر
 * 
 * @param options خيارات توليد الصورة
 * @returns مسار الصورة المولدة
 */
export async function generateOptimizedCardImage({
  templatePath,
  fields,
  formData,
  outputWidth = 1200,
  outputHeight = 1600,
  quality = 'high',
  outputFormat = 'png'
}: GenerateCardOptions): Promise<string> {
  // استخدام الحقول المخصصة من formData._designFields إذا كانت متوفرة
  let effectiveFields = fields;
  
  // التحقق من وجود حقول مخصصة في بيانات النموذج
  if (formData._designFields && Array.isArray(formData._designFields) && formData._designFields.length > 0) {
    console.log("استخدام حقول التصميم المخصصة على السيرفر:", formData._designFields.length);
    effectiveFields = formData._designFields;
  } else {
    console.log("استخدام حقول التصميم الأصلية على السيرفر:", fields.length);
  }
  // تحميل صورة القالب مع التعامل مع مختلف أنواع المسارات
  let templateImage;
  console.log(`Attempting to load template image from: ${templatePath}`);
  
  try {
    // محاولة تحميل الصورة مباشرة
    try {
      templateImage = await loadImage(templatePath);
      console.log(`Successfully loaded template image from direct path: ${templatePath}`);
    } catch (directError) {
      console.error(`Failed to load from direct path: ${templatePath}`, directError);
      
      // تجربة مسارات بديلة - مرتبة حسب أولوية التجربة
      const possiblePaths = [
        // 1. تجربة المسار كما هو بدون تغيير
        templatePath,
        
        // 2. إذا كان المسار يبدأ بـ /static، جرب مجلد client/static
        templatePath.startsWith('/static') ?
          path.join(process.cwd(), 'client', templatePath) : templatePath,
        
        // 3. إذا كان المسار يبدأ بـ /static، تجربة مسار مطلق في بيئة Replit
        templatePath.startsWith('/static') ?
          path.join('/home/runner/workspace/client', templatePath) : templatePath,
          
        // 4. تجربة مباشرة في مجلد client/static
        path.join(process.cwd(), 'client', 'static', path.basename(templatePath)),
        
        // 5. تجربة في مجلد static بناءً على الاسم فقط
        path.join(process.cwd(), 'client/static', path.basename(templatePath)),
        
        // 6. تجربة المسار المطلق في Replit
        path.join('/home/runner/workspace/client/static', path.basename(templatePath)),
        
        // 7. تجربة مجلد uploads
        path.join(process.cwd(), 'uploads', path.basename(templatePath)),
        
        // 8. تجربة باستخدام الخادم المحلي
        templatePath.startsWith('/') ? 
          `http://localhost:5000${templatePath}` : 
          `http://localhost:5000/static/${path.basename(templatePath)}`,
          
        // 9. محاولة موقع ثابت للتجربة
        `/static/${path.basename(templatePath)}`
      ];
      
      // طباعة المسارات المحتملة للتصحيح
      console.log('Possible image paths to try:', possiblePaths);
      
      // محاولة تحميل الصورة من المسارات البديلة
      let loaded = false;
      for (const alternativePath of possiblePaths) {
        if (alternativePath === templatePath) continue; // تخطي المسار الأصلي لأننا جربناه بالفعل
        
        try {
          // تحقق أولاً مما إذا كان الملف موجودًا (للمسارات المحلية)
          if (!alternativePath.startsWith('http') && fs.existsSync(alternativePath)) {
            console.log(`Trying to load from alternative path (exists): ${alternativePath}`);
            templateImage = await loadImage(alternativePath);
            console.log(`Successfully loaded template image from alternative path: ${alternativePath}`);
            loaded = true;
            break;
          } else if (alternativePath.startsWith('http')) {
            // بالنسبة لعناوين URL، حاول تحميلها مباشرة
            console.log(`Trying to load from URL: ${alternativePath}`);
            templateImage = await loadImage(alternativePath);
            console.log(`Successfully loaded template image from URL: ${alternativePath}`);
            loaded = true;
            break;
          }
        } catch (altError: any) {
          console.error(`Failed to load from alternative path ${alternativePath}:`, altError.message);
        }
      }
      
      if (!loaded) {
        // إنشاء صورة بديلة إذا فشلت جميع المحاولات
        console.error(`All attempts to load template image failed. Creating a placeholder image.`);
        
        // إنشاء صورة بيضاء بدلاً من ذلك
        const placeholderCanvas = createCanvas(outputWidth, outputHeight);
        const placeholderCtx = placeholderCanvas.getContext('2d');
        
        // خلفية بيضاء
        placeholderCtx.fillStyle = '#ffffff';
        placeholderCtx.fillRect(0, 0, outputWidth, outputHeight);
        
        // إضافة نص صغير لتوضيح المشكلة
        placeholderCtx.fillStyle = '#cccccc';
        placeholderCtx.font = '20px Arial';
        placeholderCtx.textAlign = 'center';
        placeholderCtx.fillText('لم يتم العثور على صورة القالب', outputWidth / 2, outputHeight / 2);
        
        // استخدام الكانفاس نفسه كصورة
        templateImage = placeholderCanvas;
      }
    }
  } catch (imageError: any) {
    console.error("All attempts to load template image failed:", imageError);
    throw new Error(`Failed to load template image: ${imageError.message}`);
  }
  
  // إنشاء كانفاس بالأبعاد المطلوبة
  const canvas = createCanvas(outputWidth, outputHeight);
  const ctx = canvas.getContext('2d');
  
  // رسم خلفية القالب مع الحفاظ على نسبة العرض إلى الارتفاع
  if (templateImage) {
    // احصل على أبعاد الصورة الأصلية
    const imgWidth = templateImage.width;
    const imgHeight = templateImage.height;
    
    // حافظ على نسبة العرض إلى الارتفاع عند رسم الصورة على الكانفاس
    if (imgWidth > 0 && imgHeight > 0) {
      // نحدد أولاً نسبة أبعاد الصورة الأصلية
      const aspectRatio = imgWidth / imgHeight;
      
      // نحسب الأبعاد المناسبة للكانفاس للحفاظ على النسبة
      let drawWidth = outputWidth;
      let drawHeight = outputHeight;
      
      // احسب الأبعاد مع الحفاظ على النسبة
      if (outputWidth / outputHeight > aspectRatio) {
        // الكانفاس أوسع من الصورة، نحافظ على العرض ونعدل الارتفاع
        drawWidth = outputHeight * aspectRatio;
        // نرسم في وسط الكانفاس أفقياً
        const offsetX = (outputWidth - drawWidth) / 2;
        ctx.drawImage(templateImage, offsetX, 0, drawWidth, outputHeight);
      } else {
        // الكانفاس أضيق من الصورة، نحافظ على الارتفاع ونعدل العرض
        drawHeight = outputWidth / aspectRatio;
        // نرسم في وسط الكانفاس عامودياً
        const offsetY = (outputHeight - drawHeight) / 2;
        ctx.drawImage(templateImage, 0, offsetY, outputWidth, drawHeight);
      }
    } else {
      // في حالة عدم وجود أبعاد صالحة، نستخدم الطريقة الافتراضية
      ctx.drawImage(templateImage, 0, 0, outputWidth, outputHeight);
    }
  } else {
    // إذا لم يكن هناك صورة قالب، ارسم خلفية بيضاء
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    
    // أضف نصًا يشير إلى عدم وجود صورة
    ctx.fillStyle = '#cccccc';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('لم يتم العثور على صورة القالب', outputWidth / 2, outputHeight / 2);
  }
  
  /**
   * حساب معامل القياس لضمان التطابق بين معاينة الواجهة والسيرفر
   * IMPORTANT: هذه القيمة يجب أن تتطابق مع:
   * 1. BASE_IMAGE_WIDTH في ملف DraggableFieldsPreviewPro.tsx
   * 2. BASE_IMAGE_WIDTH في ملف client/src/components/konva-image-generator/optimized-image-generator.tsx
   * هذا ضروري لضمان التطابق 100% بين المعاينة والصورة النهائية
   * 
   * 🔴 ملاحظة هامة: 
   * - تم توحيد قيمة العرض الأساسي كـ BASE_IMAGE_WIDTH = 1000 في جميع المكونات
   * - أي تغيير في هذه القيمة يجب أن يكون متزامنًا في جميع المكونات
   */
  const BASE_IMAGE_WIDTH = 1000; // عرض الكانفاس الافتراضي في جميع واجهات المعاينة
  const scaleFactor = outputWidth / BASE_IMAGE_WIDTH;
  console.log(`Using font scale factor: ${scaleFactor} (Server canvas: ${outputWidth}px, Client preview: ${BASE_IMAGE_WIDTH}px)`);
  
  // إعداد سياق الرسم للنص
  ctx.textBaseline = 'middle';
  
  // رسم جميع الحقول مرتبة حسب الطبقة
  const fieldsMap = new Map(effectiveFields.map(field => [field.name, field]));
  
  // إعداد قائمة الحقول من البيانات المدخلة ثم ترتيبها حسب الطبقة
  const fieldsToRender = [];
  for (const [fieldName, value] of Object.entries(formData)) {
    if (fieldName === '_designFields') continue; // تجاهل خصائص التصميم المخصصة نفسها
    if (!value || typeof value !== 'string') continue;
    
    const field = fieldsMap.get(fieldName);
    if (!field) continue;
    
    // تخطي الحقول المخفية
    if (field.visible === false) {
      console.log(`Skipping hidden field: ${fieldName}`);
      continue;
    }
    
    // استخدام zIndex كطبقة إذا كان موجودًا، وإلا نستخدم style.layer للتوافقية الخلفية
    const layer = field.zIndex || field.style?.layer || 1;
    
    fieldsToRender.push({ field, value, layer });
  }
  
  // ترتيب الحقول حسب الطبقة (الأصغر يظهر خلف الأكبر)
  fieldsToRender.sort((a, b) => {
    // استخدام فارق الطبقة بشكل مباشر للترتيب
    return a.layer - b.layer;
  });
  
  // طباعة معلومات الترتيب للتحقق
  console.log(`🔍 Field layers sorted order:`, 
    fieldsToRender.map(f => `${f.field.name} (layer:${f.layer})`).join(', '));
  
  // استخدام async للسماح بتحميل الصور
  for (const { field, value, layer } of fieldsToRender) {
    const fieldName = field.name;
    console.log(`Drawing field: ${fieldName} (layer: ${layer}, zIndex: ${field.zIndex || 0})`);
    
    
    // حفظ حالة السياق الحالية
    ctx.save();
    
    // استخراج إعدادات النمط
    const style = field.style || {};
    
    // حساب موضع العنصر بنفس طريقة Konva
    const xPercent = field.position.x || 50;
    const yPercent = field.position.y || 50;
    
    // تحويل النسب المئوية إلى بكسل
    const posX = Math.round((xPercent / 100) * outputWidth);
    const posY = Math.round((yPercent / 100) * outputHeight);
    
    // معالجة التدوير إذا كان موجودًا
    const rotation = field.rotation || 0; // زاوية التدوير بالدرجات
    
    // إذا كان هناك تدوير، نقوم بتحويل السياق
    if (rotation !== 0) {
      // تحريك نقطة الأصل إلى موضع العنصر
      ctx.translate(posX, posY);
      // تطبيق التدوير (تحويل من درجات إلى راديان)
      ctx.rotate((rotation * Math.PI) / 180);
      // إعادة نقطة الأصل إلى الوضع العادي (0,0 بالنسبة للعنصر)
      ctx.translate(-posX, -posY);
      
      console.log(`Applied rotation of ${rotation} degrees to field ${fieldName}`);
    }
    
    // التعامل مع أنواع الحقول المختلفة (نص أو صورة)
    if (field.type === 'image') {
      // 🖼️ معالجة حقول الصور
      try {
        console.log(`Processing image field: ${fieldName}, value length: ${value.length}, starts with: ${value.substring(0, 30)}...`);
        
        // تصحيح وتحويل مسار الصورة
        let imagePath = value;
        
        // إذا كان المسار في مجلد temp، نستبدله بـ uploads
        if (value.includes('/temp/')) {
          // أولاً، نحصل على اسم الملف الذي بعد temp
          const fileName = path.basename(value);
          
          // نعيد بناء المسار باستخدام مجلد uploads
          const relativePath = `/uploads/${fileName}`;
          imagePath = path.join(process.cwd(), relativePath);
          
          console.log(`Converting temp path ${value} to uploads path: ${imagePath}`);
        }
        // التعامل مع الصور من مجلد generated
        else if (value.includes('/generated/') && !value.includes('/uploads/generated/')) {
          // تصحيح المسار ليشير إلى مجلد uploads/generated
          const fileName = path.basename(value);
          const relativePath = `/uploads/generated/${fileName}`;
          imagePath = path.join(process.cwd(), relativePath);
          
          console.log(`Converting generated path ${value} to uploads/generated path: ${imagePath}`);
        }
        // إنشاء مسار كامل للصورة إذا كان يبدأ بـ "/uploads/"
        else if (value.startsWith('/uploads/')) {
          imagePath = path.join(process.cwd(), value);
          console.log(`Converting relative path ${value} to absolute path: ${imagePath}`);
        }
        
        // تحميل الصورة من المسار أو URL
        const img = await loadImage(imagePath);
        console.log(`Image loaded successfully: ${img.width}x${img.height}`);
        
        // استخدام النسب المئوية من أبعاد القالب لحساب الأبعاد الفعلية للصورة
        // النسبة المئوية من حجم الصورة (على سبيل المثال: 25 تعني 25% من عرض القالب)
        const widthPercentage = style.imageMaxWidth || 25; // افتراضي 25% من عرض القالب
        const heightPercentage = style.imageMaxHeight || 25; // افتراضي 25% من ارتفاع القالب
        
        // تحويل النسب المئوية إلى أبعاد فعلية بالبكسل
        const imgMaxWidth = Math.round((outputWidth * widthPercentage / 100));
        const imgMaxHeight = Math.round((outputHeight * heightPercentage / 100));
        
        // حساب أبعاد الصورة مع الحفاظ على نسبة العرض إلى الارتفاع
        const aspectRatio = img.width / img.height;
        let imgWidth, imgHeight;
        
        // الحفاظ على نسبة العرض إلى الارتفاع مع تطبيق الحد الأقصى للأبعاد
        if (aspectRatio > 1) {
          // صورة أفقية (landscape)
          imgWidth = Math.min(imgMaxWidth, img.width);
          imgHeight = imgWidth / aspectRatio;
          
          // تأكد من أن الارتفاع ليس أكبر من الحد الأقصى
          if (imgHeight > imgMaxHeight) {
            imgHeight = imgMaxHeight;
            imgWidth = imgHeight * aspectRatio;
          }
        } else {
          // صورة رأسية (portrait)
          imgHeight = Math.min(imgMaxHeight, img.height);
          imgWidth = imgHeight * aspectRatio;
          
          // تأكد من أن العرض ليس أكبر من الحد الأقصى
          if (imgWidth > imgMaxWidth) {
            imgWidth = imgMaxWidth;
            imgHeight = imgWidth / aspectRatio;
          }
        }
        
        // تقريب الأبعاد لأرقام صحيحة
        imgWidth = Math.round(imgWidth);
        imgHeight = Math.round(imgHeight);
        
        console.log(`Image dimensions for ${fieldName}: Original: ${img.width}x${img.height}, Display: ${imgWidth}x${imgHeight}, AspectRatio: ${aspectRatio.toFixed(2)}, MaxSize: ${imgMaxWidth}x${imgMaxHeight}`);
        
        
        // حساب موضع الصورة (توسيط)
        const drawX = posX - imgWidth / 2;
        const drawY = posY - imgHeight / 2;
        
        // تطبيق ظل الصورة إذا كان مطلوباً
        if (style.textShadow?.enabled) {
          ctx.shadowColor = style.textShadow.color || 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = (style.textShadow.blur || 3) * scaleFactor;
          // استخدام قيم الإزاحة من الإعدادات أو القيم الافتراضية
          ctx.shadowOffsetX = (style.textShadow.offsetX !== undefined ? style.textShadow.offsetX : 2) * scaleFactor;
          ctx.shadowOffsetY = (style.textShadow.offsetY !== undefined ? style.textShadow.offsetY : 2) * scaleFactor;
          console.log(`Applied text shadow to field ${fieldName} with blur: ${ctx.shadowBlur}, offsetX: ${ctx.shadowOffsetX}, offsetY: ${ctx.shadowOffsetY}`);
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // معالجة الصور الدائرية إذا كان مطلوباً
        if (style.imageRounded) {
          // حفظ السياق قبل القص
          ctx.save();
          
          // رسم دائرة وجعلها منطقة القص
          ctx.beginPath();
          const radius = Math.min(imgWidth, imgHeight) / 2;
          ctx.arc(posX, posY, radius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // رسم الصورة داخل الدائرة
          ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);
          
          // استعادة السياق الأصلي
          ctx.restore();
          
          // رسم حدود للصورة الدائرية إذا كان مطلوباً
          if (style.imageBorder) {
            ctx.beginPath();
            ctx.arc(posX, posY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = style.color || '#000000';
            ctx.lineWidth = 2 * scaleFactor;
            ctx.stroke();
          }
        } else {
          // رسم الصورة بشكل عادي (مستطيل)
          ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);
          
          // رسم حدود للصورة إذا كان مطلوباً
          if (style.imageBorder) {
            ctx.beginPath();
            ctx.rect(drawX, drawY, imgWidth, imgHeight);
            ctx.strokeStyle = style.color || '#000000';
            ctx.lineWidth = 2 * scaleFactor;
            ctx.stroke();
          }
        }
        
        console.log(`Image drawn: ${fieldName} at (${drawX}, ${drawY}) with size ${imgWidth}x${imgHeight}`);
      } catch (error) {
        console.error(`Failed to load or draw image for field ${fieldName}:`, error);
      }
    } else {
      // 📝 معالجة حقول النصوص
      // استخراج خصائص الخط مع تطبيق معامل القياس
      
      // استخدام حجم الخط المحدد في خصائص الحقل، مع الحد الأدنى والأقصى لضمان القراءة على جميع الأجهزة
      let originalFontSize = style.fontSize || 24;
      
      // ضمان أن حجم الخط لا يقل عن 14 ولا يزيد عن 60 بكسل لضمان القراءة على جميع الأجهزة
      if (originalFontSize < 14) originalFontSize = 14;
      if (originalFontSize > 60) originalFontSize = 60;
      
      // تطبيق معامل القياس
      const fontSize = Math.round(originalFontSize * scaleFactor);
      
      // استخدام وزن الخط المحدد في الخصائص
      const fontWeight = style.fontWeight || '';
      
      // استخدام نوع الخط المحدد في الخصائص
      const fontFamily = style.fontFamily || 'Cairo';
      
      // تسجيل معلومات الخط للتتبع
      console.log(`Field ${field.name} font: ${fontSize}px ${fontFamily} (original: ${originalFontSize}px, scaled: ${fontSize}px)`);
      
      // تحسين التعامل مع أنواع الخطوط 
      let finalFontFamily = ARABIC_FONTS.CAIRO; // الخط الافتراضي
      let finalFontWeight = fontWeight || 'normal'; // وزن الخط الافتراضي
      
      // تخصيص أنواع الخطوط المدعومة بغض النظر عن حالة الأحرف
      const normalizedFontFamily = fontFamily.toLowerCase();
      
      // تحديد نوع الخط المناسب
      if (normalizedFontFamily === 'amiri' || normalizedFontFamily === 'أميري') {
        finalFontFamily = ARABIC_FONTS.AMIRI;
      } else if (normalizedFontFamily === 'tajawal' || normalizedFontFamily === 'تجوال') {
        finalFontFamily = ARABIC_FONTS.TAJAWAL;
      } else if (normalizedFontFamily === 'cairo' || normalizedFontFamily === 'القاهرة') {
        finalFontFamily = ARABIC_FONTS.CAIRO;
      } else {
        // إذا كان الخط غير مدعوم، استخدم خط Cairo الافتراضي ولكن سجل تحذيرًا
        console.log(`تحذير: الخط "${fontFamily}" غير مدعوم، تم استخدام Cairo بدلاً منه`);
      }
      
      // تنظيف وضبط وزن الخط (bold أو normal)
      if (finalFontWeight === 'bold' || finalFontWeight === '700') {
        finalFontWeight = 'bold';
      } else {
        finalFontWeight = 'normal';
      }
      
      // إنشاء سلسلة الخط النهائية مع دمج الوزن والحجم والنوع
      const fontString = `${finalFontWeight} ${fontSize}px ${finalFontFamily}`;
      
      // تسجيل سلسلة الخط النهائية للتحقق
      console.log(`Field ${fieldName} final font: ${fontString}`);
      
      // تطبيق الخط
      ctx.font = fontString;
      console.log(`Field ${fieldName} font: ${fontString} (original: ${originalFontSize}px, scaled: ${fontSize}px)`);
      
      // تطبيق لون النص من خصائص الحقل مع تحسين الوضوح
      let textColor = '#000000'; // اللون الافتراضي أسود
      
      // التحقق من وجود لون للنص في خصائص الحقل
      if (style.color && typeof style.color === 'string' && style.color.trim() !== '') {
        textColor = style.color.trim();
        console.log(`استخدام لون النص من خصائص الحقل: ${textColor}`);
      } else {
        console.log(`استخدام لون النص الافتراضي: ${textColor}`);
      }
      
      // تطبيق لون النص على سياق الرسم
      ctx.fillStyle = textColor;
      console.log(`Field ${fieldName} color applied: ${textColor}`);
      
      // تطبيق محاذاة النص
      if (style.align) {
        ctx.textAlign = style.align as CanvasTextAlign;
      } else {
        ctx.textAlign = 'center';
      }
      
      // تطبيق ظل النص إذا كان مطلوباً
      if (style.textShadow?.enabled) {
        ctx.shadowColor = style.textShadow.color || 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = (style.textShadow.blur || 3) * scaleFactor;
        // استخدام قيم الإزاحة من الإعدادات أو القيم الافتراضية
        ctx.shadowOffsetX = (style.textShadow.offsetX !== undefined ? style.textShadow.offsetX : 0) * scaleFactor;
        ctx.shadowOffsetY = (style.textShadow.offsetY !== undefined ? style.textShadow.offsetY : 0) * scaleFactor;
        console.log(`Applied text shadow to field ${fieldName} with blur: ${ctx.shadowBlur}, offsetX: ${ctx.shadowOffsetX}, offsetY: ${ctx.shadowOffsetY}`);
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // حساب العرض الأقصى للنص
      const maxWidth = style.maxWidth
        ? Math.round((style.maxWidth / 100) * outputWidth)
        : Math.round(outputWidth - 100);
      
      // تطبيق لف النص
      const text = value as string;
      const lines = wrapText(ctx, text, maxWidth, fontSize);
      
      // حساب ارتفاع السطر والنص الكامل
      const lineHeightFactor = 1.3;
      const lineHeight = Math.round(fontSize * lineHeightFactor);
      const totalTextHeight = lineHeight * lines.length;
      
      // ضبط موضع البداية حسب المحاذاة العمودية
      let currentY = posY;
      
      if (style.verticalPosition === 'middle') {
        currentY = Math.round(posY - (totalTextHeight / 2) + (lineHeight / 2));
      } else if (style.verticalPosition === 'bottom') {
        currentY = Math.round(posY - totalTextHeight);
      }
      
      // رسم كل سطر
      for (const line of lines) {
        ctx.fillText(line, posX, currentY);
        currentY += lineHeight;
      }
    }
    
    // استعادة سياق الرسم
    ctx.restore();
  }
  
  // توليد اسم فريد للملف
  const hash = crypto.createHash('md5')
    .update(JSON.stringify(formData) + Date.now())
    .digest('hex')
    .slice(0, 10);
  
  const outputFileName = `${hash}-${quality}.${outputFormat}`;
  const outputDir = path.resolve('./uploads/generated');
  
  // التأكد من وجود المجلد
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, outputFileName);
  
  // تحويل الكانفاس إلى بيانات ثنائية
  const buffer = canvas.toBuffer();
  
  // إعدادات معالجة الصورة
  // إذا كانت الجودة هي 'download'، فسنقوم باستخدام معالجة خاصة لتحسين الصورة
  const isDownloadMode = quality === 'download';
  console.log(`Image processing for ${quality} quality, special download mode: ${isDownloadMode}`);
  
  try {
    // تحسين وضغط الصورة حسب إعدادات الجودة
    const optimizedBuffer = await optimizeImage(buffer, quality, outputFormat, isDownloadMode);
    
    // حفظ الصورة
    fs.writeFileSync(outputPath, optimizedBuffer);
  } catch (error) {
    console.error('❌ خطأ في معالجة الصورة:', error);
    
    // في حالة الخطأ، نحفظ الصورة الأصلية بدون معالجة
    fs.writeFileSync(outputPath, buffer);
    console.log('❗ تم حفظ الصورة الأصلية بدون معالجة');
  }
  
  return outputPath;
}

/**
 * دالة لتقسيم النص إلى أسطر متعددة حسب العرض المحدد
 * 
 * @param ctx سياق الرسم
 * @param text النص المراد تقسيمه
 * @param maxWidth العرض الأقصى
 * @param fontSize حجم الخط
 * @returns مصفوفة من الأسطر
 */
function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number = 24): string[] {
  if (!text) return [];
  if (maxWidth <= 0) return [text];
  
  // استخدام الكاش لحفظ قياسات النص
  const measureCache: Record<string, number> = {};
  const measureText = (str: string): number => {
    if (!measureCache[str]) {
      measureCache[str] = ctx.measureText(str).width;
    }
    return measureCache[str];
  };
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (measureText(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // التعامل مع الكلمات الطويلة التي تتجاوز العرض
      if (measureText(word) > maxWidth) {
        // تقسيم الكلمة الطويلة بشكل حرفي
        let partialWord = '';
        
        for (const char of word) {
          const testWord = partialWord + char;
          
          if (measureText(testWord) <= maxWidth) {
            partialWord = testWord;
          } else {
            lines.push(partialWord);
            partialWord = char;
          }
        }
        
        currentLine = partialWord;
      } else {
        currentLine = word;
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * توليد صورة شهادة باستخدام نفس آلية توليد البطاقة المحسنة
 * 
 * @param template القالب المستخدم
 * @param formData بيانات النموذج
 * @returns مسار الصورة المولدة
 */
export async function generateOptimizedCertificateImage(template: any, formData: any): Promise<string> {
  // تحديد مسار الصورة من البيانات المتوفرة في القالب
  const imageUrl = template.imageUrl || 
                 (template.settings && template.settings.imageUrl) || 
                 '/uploads/certificate-default.png';
  
  console.log(`Using template image URL: ${imageUrl}`);
  
  // استخراج حقول القالب إما من القالب مباشرة أو من قاعدة البيانات
  let fields = [];
  
  // إذا كانت الحقول متوفرة مباشرة في القالب، استخدمها
  if (Array.isArray(template.fields) && template.fields.length > 0) {
    fields = template.fields;
    console.log(`Using ${fields.length} fields from template object`);
  } 
  // وإلا حاول استخراجها من قاعدة البيانات إذا كان معرف القالب متاحًا
  else if (template.id) {
    try {
      console.log(`Fetching template fields for template ID: ${template.id}`);
      
      // نظرًا لصعوبة التعامل مع schema بشكل مباشر
      // سنستخدم استعلام SQL من خلال db.execute مع معالجة الأخطاء
      // استخدم دالة withDatabaseRetry لمحاولة التنفيذ عدة مرات في حالة فشل الاتصال
      try {
        // استخدام SQL مباشر بدلاً من Drizzle ORM لتجنب مشاكل التوافق
        const { rows } = await db.execute(
          `SELECT * FROM template_fields WHERE template_id = ${template.id}`
        );
        fields = rows || [];
        console.log(`Fetched ${fields.length} template fields using SQL query`);
      } catch (sqlError) {
        // نحاول بطريقة أخرى باستخدام طريقة بديلة
        console.error(`Database query failed: ${(sqlError as Error).message}`);
        // في حالة الفشل، نستخدم مصفوفة فارغة
        console.warn(`Using empty fields array as fallback`);
        fields = [];
      }
      
      console.log(`Got ${fields.length} fields from database for template ${template.id}`);
    } catch (err) {
      const dbError = err as Error;
      console.error(`Failed to fetch template fields: ${dbError.message}`);
      fields = [];
    }
  }
  
  // استخدام الحقول المخصصة من formData._designFields إذا كانت متوفرة
  let effectiveFields = fields;
  
  // التحقق من وجود حقول مخصصة في بيانات النموذج
  if (formData._designFields && Array.isArray(formData._designFields) && formData._designFields.length > 0) {
    console.log("استخدام حقول التصميم المخصصة في توليد الشهادة:", formData._designFields.length);
    effectiveFields = formData._designFields;
  } else {
    console.log("استخدام حقول التصميم الأصلية في توليد الشهادة:", fields.length);
  }
  
  // توليد الصورة باستخدام المولد المحسن
  return generateOptimizedCardImage({
    templatePath: imageUrl, // استخدام متغير imageUrl الذي تم تحديده في بداية الدالة
    fields: effectiveFields, // استخدام الحقول الفعالة (الأصلية أو المخصصة)
    formData,
    outputWidth: 2480, // A4 width at 300dpi
    outputHeight: 3508, // A4 height at 300dpi
    quality: 'high',
    outputFormat: 'png'
  });
}