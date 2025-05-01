/**
 * تكوين CORS لدعم استضافة الواجهة الأمامية والخلفية على نطاقات مختلفة
 * هذا الملف يتيح ضبط النطاقات المسموح لها بالوصول إلى API
 */

import { CorsOptions } from 'cors';

/**
 * الحصول على النطاقات المسموح بها من متغيرات البيئة
 * يدعم قائمة من النطاقات مفصولة بفواصل
 * @returns مصفوفة من النطاقات المسموح بها
 */
export function getAllowedOrigins(): string[] {
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173';
  return allowedOriginsStr.split(',').map(origin => origin.trim());
}

/**
 * إنشاء خيارات CORS بناءً على النطاقات المسموح بها
 * @returns خيارات CORS
 */
export function createCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();
  
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // السماح بالطلبات بدون أصل (مثل الطلبات من المتصفح مباشرة أو من بوستمان)
      if (!origin) {
        return callback(null, true);
      }
      
      // التحقق مما إذا كان الأصل مسموحًا به
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin ${origin} not allowed`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // السماح بإرسال ملفات تعريف الارتباط
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}

/**
 * التحقق من صحة تكوين CORS
 * هذه الدالة تطبع رسائل تحذير إذا كانت هناك مشاكل في تكوين CORS
 */
export function validateCorsConfig(): void {
  const allowedOrigins = getAllowedOrigins();
  
  if (allowedOrigins.length === 0) {
    console.warn('⚠️ CORS Warning: No allowed origins specified.');
  }
  
  if (allowedOrigins.includes('*') && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ CORS Warning: Wildcard origin (*) is used in production environment.');
  }
  
  // التحقق من وجود نطاقات غير صالحة
  const invalidOrigins = allowedOrigins.filter(origin => {
    if (origin === '*') return false;
    try {
      new URL(origin);
      return false;
    } catch (e) {
      return true;
    }
  });
  
  if (invalidOrigins.length > 0) {
    console.warn(`⚠️ CORS Warning: Invalid origins detected: ${invalidOrigins.join(', ')}`);
  }
  
  console.log(`🔒 CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
}