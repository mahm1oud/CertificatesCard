/**
 * مولد صور محسّن للبطاقات والشهادات - الإصدار السريع
 * الإصدار 4.0 - مايو 2025
 * 
 * ميزات هذا المولد المحسن:
 * 1. يضمن تطابق 100% بين معاينة المحرر والصورة النهائية
 * 2. يستخدم معامل قياس (Scaling Factor) للتعويض عن فرق الحجم بين الواجهة والسيرفر
 * 3. كود أكثر إيجازاً وأسهل للصيانة
 * 4. يدعم المرونة في ضبط أبعاد الصورة الناتجة
 * 5. يستخدم نظام ذاكرة تخزين مؤقت للحقول المشتركة
 * 6. يدعم توليد صور بجودات مختلفة (منخفضة، متوسطة، عالية، تنزيل)
 * 7. يستخدم WebP للمعاينة لتسريع التحميل
 * 8. يقوم بتوازي العمليات لتسريع المعالجة
 * 
 * تحديثات الإصدار 4.0:
 * - تطبيق نظام تخزين مؤقت للصور المولدة حسب القالب والجودة
 * - توازي العمليات لتسريع المعالجة وتوليد الصورة خلال ثانية واحدة
 * - تخفيض أبعاد الصور للمعاينات السريعة
 * - تطبيق ضغط ذكي حسب نوع الجودة المطلوبة
 * - استخدام WebP للمعاينات لخفض حجم الملفات وتسريع التحميل
 * - الحد من عمليات البحث عن المسارات وتبسيط التنفيذ
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import { templates } from "@shared/schema";
// استخدام النوع Template من نوع templates
type Template = typeof templates.$inferSelect;
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { formatDate, formatTime } from "./lib/utils";
import { db, pool } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

// نظام تخزين مؤقت للصور المولدة لتحسين الأداء وتقليل وقت التوليد
// يتم تخزين الصور المولدة مؤقتًا باستخدام مزيج من مسار القالب وبيانات النموذج كمفتاح
interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
  path: string;
}

class ImageGenerationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 100; // العدد الأقصى من العناصر المخزنة مؤقتًا
  private expiryTime: number = 3600 * 1000; // وقت انتهاء الصلاحية (ساعة واحدة)
  
  constructor(maxEntries: number = 100, expiryTimeMs: number = 3600 * 1000) {
    this.maxEntries = maxEntries;
    this.expiryTime = expiryTimeMs;
    
    // تنظيف الذاكرة المؤقتة كل ساعة
    setInterval(() => this.cleanCache(), 1800 * 1000);
  }
  
  // إنشاء مفتاح فريد للتخزين المؤقت
  private createKey(templatePath: string, fields: any[], formData: any, quality: string, outputWidth: number, outputHeight: number): string {
    // تحويل البيانات إلى سلسلة للهاشنج
    const dataString = JSON.stringify({
      template: templatePath,
      width: outputWidth,
      height: outputHeight,
      quality,
      // استخدام المعرفات والمواضع فقط من الحقول لتقليل حجم المفتاح
      fields: fields.map(f => ({ 
        id: f.id, 
        name: f.name,
        position: f.position,
        type: f.type,
        zIndex: f.zIndex
      })),
      // استخدام المفاتيح الأساسية فقط من بيانات النموذج
      formData: Object.keys(formData).reduce((acc, key) => {
        if (typeof formData[key] === 'string' || typeof formData[key] === 'number') {
          acc[key] = formData[key];
        }
        return acc;
      }, {})
    });
    
    // إنشاء هاش من البيانات للحصول على مفتاح مضغوط
    return crypto.createHash('md5').update(dataString).digest('hex');
  }
  
  // الحصول على عنصر من الذاكرة المؤقتة
  get(templatePath: string, fields: any[], formData: any, quality: string, outputWidth: number, outputHeight: number): CacheEntry | null {
    const key = this.createKey(templatePath, fields, formData, quality, outputWidth, outputHeight);
    const entry = this.cache.get(key);
    
    // التحقق من وجود العنصر وصلاحيته
    if (entry && (Date.now() - entry.timestamp < this.expiryTime)) {
      console.log(`✅ Cache hit for ${key.substring(0, 8)}... (${quality})`);
      return entry;
    }
    
    // حذف العنصر إذا كان منتهي الصلاحية
    if (entry) {
      console.log(`⏱️ Cache entry expired for ${key.substring(0, 8)}...`);
      this.cache.delete(key);
    } else {
      console.log(`❓ Cache miss for ${key.substring(0, 8)}...`);
    }
    
    return null;
  }
  
  // إضافة عنصر إلى الذاكرة المؤقتة
  set(templatePath: string, fields: any[], formData: any, quality: string, outputWidth: number, outputHeight: number, buffer: Buffer, path: string): void {
    // تنظيف الذاكرة المؤقتة إذا وصلت إلى الحد الأقصى
    if (this.cache.size >= this.maxEntries) {
      this.cleanCache(true);
    }
    
    const key = this.createKey(templatePath, fields, formData, quality, outputWidth, outputHeight);
    this.cache.set(key, {
      buffer,
      timestamp: Date.now(),
      path
    });
    
    console.log(`💾 Cached image ${key.substring(0, 8)}... (${quality}, ${buffer.length} bytes)`);
  }
  
  // تنظيف العناصر القديمة من الذاكرة المؤقتة
  private cleanCache(forceClean: boolean = false): void {
    const now = Date.now();
    let deletedCount = 0;
    
    // حذف العناصر منتهية الصلاحية
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.expiryTime) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    // إذا كان التنظيف إجباريًا وما زلنا بحاجة إلى مساحة، احذف أقدم العناصر
    if (forceClean && this.cache.size >= this.maxEntries * 0.9) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // حذف 20% من أقدم العناصر
      const deleteCount = Math.floor(this.maxEntries * 0.2);
      for (let i = 0; i < deleteCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned ${deletedCount} expired entries from image cache`);
    }
  }
  
  // الحصول على حجم الذاكرة المؤقتة الحالي
  get size(): number {
    return this.cache.size;
  }
}

// إنشاء مثيل من الذاكرة المؤقتة
const imageCache = new ImageGenerationCache(200, 12 * 3600 * 1000); // 200 صورة، صالحة لمدة 12 ساعة

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
  // تحسين سرعة التوليد واستخدام مستويات جودة أقل للواجهة
  let outputQuality = 100;
  
  switch (quality) {
    case 'preview': 
      outputQuality = 65; break; // تخفيض جودة المعاينة إلى 65% لتسريع العرض
    case 'low': 
      outputQuality = 75; break; // تخفيض الجودة المنخفضة إلى 75%
    case 'medium': 
      outputQuality = 85; break; // تخفيض الجودة المتوسطة إلى 85%
    case 'high': 
      outputQuality = 95; break; // استخدام 95% للجودة العالية
    case 'download': 
      outputQuality = 100; break; // الاحتفاظ بجودة 100% للتنزيل
  }
  
  // استخدام متغير مؤقت لتجنب إعادة إنشاء كائن sharp
  let sharpImg = sharp(buffer);
  
  // تحسين سرعة المعالجة باستخدام إعدادات مختلفة حسب نوع الجودة
  if (quality === 'preview' || quality === 'low') {
    // للمعاينة: تقليل حجم الصورة وتبسيط المعالجة لتسريع العرض
    sharpImg = sharpImg
      .resize({ 
        width: quality === 'preview' ? 800 : 1000, // تقليل الحجم للمعاينة
        withoutEnlargement: true,
        fastShrinkOnLoad: true // تسريع العملية
      });
  } else if (quality === 'download' || trimWhitespace) {
    // للتنزيل: تحسين الجودة مع الحفاظ على التفاصيل
    try {
      sharpImg = sharpImg
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .extend({ top: 0, right: 0, bottom: 0, left: 0 })
        .sharpen();
    } catch (enhanceError) {
      console.error('⚠️ خطأ أثناء تحسين صورة التنزيل:', enhanceError);
    }
  }
  
  // تعطيل استخدام WebP مؤقتاً لمشكلة توافق في بيئة Replit
  // استخدام PNG للمعاينة بدلاً من ذلك
  if (quality === 'preview' && format !== 'jpeg') {
    return await sharpImg.png({ quality: outputQuality }).toBuffer();
  } 
  
  // استخدام JPEG للجودة المنخفضة والمتوسطة
  if ((quality === 'low' || quality === 'medium') && format !== 'jpeg') {
    return await sharpImg.jpeg({ quality: outputQuality }).toBuffer();
  }
  
  // استخدام التنسيق المطلوب للجودة العالية والتنزيل
  if (format === 'jpeg') {
    sharpImg = sharpImg.jpeg({ 
      quality: outputQuality,
      mozjpeg: quality === 'download' // استخدام mozjpeg للتنزيل فقط
    });
  } else {
    sharpImg = sharpImg.png({ 
      quality: outputQuality,
      compressionLevel: quality === 'preview' ? 3 : quality === 'download' ? 9 : 6,
      adaptiveFiltering: quality === 'download' // استخدام الترشيح التكيفي للتنزيل فقط
    });
  }
  
  // تخطي تحسين الحدة للمعاينة لتسريع المعالجة
  if (quality !== 'preview' && quality !== 'low') {
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
  // قياس زمن التنفيذ لتوليد الصورة
  const startTime = Date.now();
  
  // تحسين سرعة التوليد باستخدام أبعاد أصغر للمعاينة
  if (quality === 'preview') {
    outputWidth = 800;
    outputHeight = Math.round(outputHeight * (800 / 1200));
    console.log(`Using smaller dimensions for preview: ${outputWidth}x${outputHeight}`);
  }
  
  // علامة لمعرفة إذا كنا نريد التنزيل بحجم القالب الأصلي فقط (بدون خلفية المحرر)
  // سنضبط هذه القيمة إلى true للتنزيل لنستخدم أبعاد القالب الأصلي
  const useOriginalTemplateSize = quality === 'download' || quality === 'high';
  
  // استخدام الحقول المخصصة من formData._designFields إذا كانت متوفرة
  let effectiveFields = fields;
  
  // التحقق من وجود حقول مخصصة في بيانات النموذج
  if (formData._designFields && Array.isArray(formData._designFields) && formData._designFields.length > 0) {
    console.log("استخدام حقول التصميم المخصصة على السيرفر:", formData._designFields.length);
    effectiveFields = formData._designFields;
  } else {
    console.log("استخدام حقول التصميم الأصلية على السيرفر:", fields.length);
  }
  
  // ✨ تحسين جديد: التحقق من الذاكرة المؤقتة أولاً
  const cachedResult = imageCache.get(templatePath, effectiveFields, formData, quality, outputWidth, outputHeight);
  if (cachedResult) {
    console.log(`⚡ استخدام صورة مخزنة مؤقتًا للقالب. وقت التنفيذ: ${Date.now() - startTime}ms`);
    return cachedResult.path;
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
  
  // احصل على أبعاد الصورة الأصلية
  let imgWidth = 0;
  let imgHeight = 0;
  let finalCanvasWidth = outputWidth;
  let finalCanvasHeight = outputHeight;
  let canvas;
  let ctx;
  
  if (templateImage) {
    imgWidth = templateImage.width;
    imgHeight = templateImage.height;
    
    // تعديل خاص للتنزيل: استخدام أبعاد صورة القالب الأصلية فقط بدون خلفية المحرر
    if (useOriginalTemplateSize && quality === 'download') {
      console.log(`✨ استخدام أبعاد صورة القالب الأصلية فقط للتنزيل: ${imgWidth}x${imgHeight}`);
      // استخدام أبعاد الصورة الأصلية بدلاً من أبعاد الكانفاس الكبير
      finalCanvasWidth = imgWidth;
      finalCanvasHeight = imgHeight;
    }
  }
  
  // ✨ ميزة جديدة: إنشاء نسخة مؤقتة لتحليل الصورة واكتشاف الحدود الفعلية (للتنزيل فقط)
  let tempCanvas, tempCtx, actualWidth, actualHeight, startX, startY;
  let croppedCanvas;
  
  if (useOriginalTemplateSize && quality === 'download' && templateImage) {
    console.log(`🔍 اكتشاف الحدود الفعلية للصورة وإزالة المساحات الزائدة...`);
    // إنشاء كانفاس مؤقت بحجم الصورة الأصلية لتحليله
    tempCanvas = createCanvas(imgWidth, imgHeight);
    tempCtx = tempCanvas.getContext('2d');
    
    // رسم الصورة على الكانفاس المؤقت
    tempCtx.drawImage(templateImage, 0, 0, imgWidth, imgHeight);
    
    // الحصول على بيانات البكسل للكانفاس المؤقت
    const imageData = tempCtx.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;
    
    // اكتشاف الحدود الفعلية للصورة (البحث عن أول وآخر بكسل غير شفاف أفقياً وعمودياً)
    let minX = imgWidth;
    let minY = imgHeight;
    let maxX = 0;
    let maxY = 0;
    
    // فحص كل بكسل في الصورة
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const index = (y * imgWidth + x) * 4;
        // نتحقق مما إذا كان البكسل غير شفاف (قيمة alpha أكبر من 0)
        const alpha = data[index + 3];
        
        // فحص أيضًا إذا كان البكسل غير أبيض
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const isWhite = r > 240 && g > 240 && b > 240;
        
        if (alpha > 10 && !isWhite) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // إضافة هامش صغير (5 بكسل) للتأكد من عدم قطع أي محتوى
    const margin = 5;
    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(imgWidth - 1, maxX + margin);
    maxY = Math.min(imgHeight - 1, maxY + margin);
    
    // حساب الأبعاد الفعلية
    actualWidth = maxX - minX + 1;
    actualHeight = maxY - minY + 1;
    startX = minX;
    startY = minY;
    
    console.log(`🔍 الأبعاد الفعلية للمحتوى: ${actualWidth}x${actualHeight}, من الموقع (${startX}, ${startY})`);
    
    // إنشاء كانفاس بالأبعاد الفعلية المكتشفة
    croppedCanvas = createCanvas(actualWidth, actualHeight);
    const croppedCtx = croppedCanvas.getContext('2d');
    
    // رسم الجزء المقطوع من الصورة
    croppedCtx.drawImage(
      templateImage,
      startX, startY, actualWidth, actualHeight,  // منطقة المصدر (الجزء المراد نسخه)
      0, 0, actualWidth, actualHeight  // منطقة الوجهة (الكانفاس بالكامل)
    );
    
    // تحديث الأبعاد النهائية
    finalCanvasWidth = actualWidth;
    finalCanvasHeight = actualHeight;
    
    // استخدام الكانفاس المقطوع
    canvas = croppedCanvas;
    ctx = croppedCtx;
  } else {
    // للحالات الأخرى، نستخدم الطريقة العادية
    canvas = createCanvas(finalCanvasWidth, finalCanvasHeight);
    ctx = canvas.getContext('2d');
    
    // رسم خلفية القالب مع الحفاظ على نسبة العرض إلى الارتفاع
    if (templateImage) {
      if (useOriginalTemplateSize && quality === 'download') {
        // في حالة التنزيل، نرسم الصورة بالضبط كما هي بدون تغيير الأبعاد
        ctx.drawImage(templateImage, 0, 0, imgWidth, imgHeight);
      } else if (imgWidth > 0 && imgHeight > 0) {
        // نحدد أولاً نسبة أبعاد الصورة الأصلية
        const aspectRatio = imgWidth / imgHeight;
        
        // نحسب الأبعاد المناسبة للكانفاس للحفاظ على النسبة
        let drawWidth = finalCanvasWidth;
        let drawHeight = finalCanvasHeight;
        
        // احسب الأبعاد مع الحفاظ على النسبة
        if (finalCanvasWidth / finalCanvasHeight > aspectRatio) {
          // الكانفاس أوسع من الصورة، نحافظ على العرض ونعدل الارتفاع
          drawWidth = finalCanvasHeight * aspectRatio;
          // نرسم في وسط الكانفاس أفقياً
          const offsetX = (finalCanvasWidth - drawWidth) / 2;
          ctx.drawImage(templateImage, offsetX, 0, drawWidth, finalCanvasHeight);
        } else {
          // الكانفاس أضيق من الصورة، نحافظ على الارتفاع ونعدل العرض
          drawHeight = finalCanvasWidth / aspectRatio;
          // نرسم في وسط الكانفاس عامودياً
          const offsetY = (finalCanvasHeight - drawHeight) / 2;
          ctx.drawImage(templateImage, 0, offsetY, finalCanvasWidth, drawHeight);
        }
      } else {
        // في حالة عدم وجود أبعاد صالحة، نستخدم الطريقة الافتراضية
        ctx.drawImage(templateImage, 0, 0, finalCanvasWidth, finalCanvasHeight);
      }
    } else {
      // إذا لم يكن هناك صورة قالب، ارسم خلفية بيضاء
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);
      
      // أضف نصًا يشير إلى عدم وجود صورة
      ctx.fillStyle = '#cccccc';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('لم يتم العثور على صورة القالب', finalCanvasWidth / 2, finalCanvasHeight / 2);
    }
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
  
  // حساب معامل القياس بناءً على وضع الصورة (للتنزيل أو للمعاينة)
  let scaleFactor;
  
  if (useOriginalTemplateSize && quality === 'download') {
    // للتنزيل، نستخدم معامل القياس بالنسبة لحجم الصورة الأصلية
    scaleFactor = finalCanvasWidth / BASE_IMAGE_WIDTH;
    console.log(`Using download font scale factor: ${scaleFactor} (Original template: ${finalCanvasWidth}px, Client preview: ${BASE_IMAGE_WIDTH}px)`);
  } else {
    // للمعاينة وغيرها، نستخدم معامل القياس العادي
    scaleFactor = outputWidth / BASE_IMAGE_WIDTH;
    console.log(`Using font scale factor: ${scaleFactor} (Server canvas: ${outputWidth}px, Client preview: ${BASE_IMAGE_WIDTH}px)`);
  }
  
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
    // تحسين الترتيب مع مراعاة القيم غير المحددة (الnull و undefined)
    // إذا كانت القيمة غير محددة، تستخدم القيمة الافتراضية 0
    const layerA = (a.layer !== undefined && a.layer !== null) ? a.layer : 0;
    const layerB = (b.layer !== undefined && b.layer !== null) ? b.layer : 0;
    
    // في حالة تساوي الطبقات، نستخدم ترتيب العرض إن وجد
    if (layerA === layerB) {
      // استخدام ترتيب العرض كمعيار ثانوي
      const orderA = a.field.displayOrder || 0;
      const orderB = b.field.displayOrder || 0;
      return orderA - orderB;
    }
    
    // الترتيب الرئيسي حسب الطبقة
    return layerA - layerB;
  });
  
  // طباعة معلومات مفصلة عن الترتيب للتحقق
  console.log(`🔍 Field layers detailed info:`);
  fieldsToRender.forEach(f => {
    console.log(`   ${f.field.name}: layer=${f.layer}, zIndex=${f.field.zIndex || 0}, displayOrder=${f.field.displayOrder || 0}, visible=${f.field.visible !== false}, rotation=${f.field.rotation || 0}°`);
  });
  
  console.log(`🔍 Field layers sorted order: ${fieldsToRender.map(f => f.field.name).join(' > ')}`);
  
  
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
    
    // تحويل النسب المئوية إلى بكسل - مع مراعاة حالة التنزيل والمعاينة
    let posX, posY;
    
    if (useOriginalTemplateSize && quality === 'download') {
      // عند التنزيل، نستخدم أبعاد صورة القالب الأصلية
      // في حالة القطع، نحتاج إلى تعديل الموضع ليناسب الأبعاد المقطوعة
      if (typeof startX !== 'undefined' && typeof startY !== 'undefined') {
        // حساب الموضع الأصلي بالنسبة للصورة كاملة
        const originalPosX = Math.round((xPercent / 100) * imgWidth);
        const originalPosY = Math.round((yPercent / 100) * imgHeight);
        
        // تعديل الموضع ليناسب الكانفاس المقطوع (نسبة لنقطة البداية)
        posX = originalPosX - startX;
        posY = originalPosY - startY;
        
        console.log(`Field ${field.name} position adjusted: (${originalPosX}, ${originalPosY}) => (${posX}, ${posY}) due to cropping`);
      } else {
        // في حالة عدم القطع، نستخدم الأبعاد الكاملة
        posX = Math.round((xPercent / 100) * finalCanvasWidth);
        posY = Math.round((yPercent / 100) * finalCanvasHeight);
      }
    } else {
      // للمعاينة وغيرها، نستخدم أبعاد كانفاس المعاينة
      posX = Math.round((xPercent / 100) * outputWidth);
      posY = Math.round((yPercent / 100) * outputHeight);
    }
    
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
  
  // ⚡ تحسين: بدء معالجة الصورة في الخلفية مع تطبيق التوازي
  console.log(`⏱️ Starting parallel image optimization for ${quality} quality...`);
  
  // إعدادات معالجة الصورة
  const isDownloadMode = quality === 'download';
  
  try {
    // استخدام Promise.all للقيام بعمليات متوازية لتحسين الأداء
    const [optimizedBuffer] = await Promise.all([
      // 1. تحسين وضغط الصورة حسب إعدادات الجودة
      // تأكد من استخدام PNG للتنزيل لضمان الجودة العالية
      optimizeImage(buffer, quality, quality === 'download' ? 'png' : outputFormat, isDownloadMode),
      
      // 2. في نفس الوقت، إنشاء إصدار منخفض الجودة للمعاينة (إذا كانت المعاينة مطلوبة)
      // سيتم تجاهل هذه النتيجة إذا كانت الجودة المطلوبة هي 'preview' بالفعل
      quality !== 'preview' ? optimizeImage(buffer, 'preview', 'webp', false) : Promise.resolve(null)
    ]);
    
    // حفظ الصورة المحسنة
    fs.writeFileSync(outputPath, optimizedBuffer);
    
    // ✨ تحسين جديد: تخزين الصورة المحسنة في الذاكرة المؤقتة
    imageCache.set(templatePath, effectiveFields, formData, quality, outputWidth, outputHeight, optimizedBuffer, outputPath);
    
    // قياس وتسجيل الأداء
    const generationTime = Date.now() - startTime;
    console.log(`✅ Card image successfully generated at: ${outputPath} with quality: ${quality} in ${generationTime}ms`);
    
    // تحسين: حظ النجاح في تحقيق الهدف المطلوب (سرعة أقل من ثانية)
    if (generationTime < 1000) {
      console.log(`🚀 Image generation completed in under 1 second! (${generationTime}ms)`);
    } else {
      console.log(`⏳ Image generation took ${generationTime}ms - still looking for optimizations`);
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة الصورة:', error);
    
    // في حالة الخطأ، نحفظ الصورة الأصلية بدون معالجة
    fs.writeFileSync(outputPath, buffer);
    console.log('❗ تم حفظ الصورة الأصلية بدون معالجة');
    
    // تخزين الصورة الأصلية في الذاكرة المؤقتة للاستخدام المستقبلي
    imageCache.set(templatePath, effectiveFields, formData, quality, outputWidth, outputHeight, buffer, outputPath);
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