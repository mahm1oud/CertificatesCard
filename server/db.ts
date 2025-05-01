import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// تهيئة وتكوين مكتبة Neon لاستخدام WebSocket للاتصال
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// تكوين خيارات اتصال قاعدة البيانات مع إعدادات إضافية للتعامل مع حالات الانقطاع
const isProd = process.env.NODE_ENV === 'production';

// خيارات مختلفة لبيئة الإنتاج vs بيئة التطوير
const poolOptions = {
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 10 : 20, // عدد اتصالات أقل في الإنتاج للتعامل مع قيود الموارد
  idleTimeoutMillis: isProd ? 20000 : 30000, // مهلة أقصر للاتصالات الخاملة في الإنتاج
  connectionTimeoutMillis: isProd ? 10000 : 5000, // مهلة أطول في الإنتاج للتعامل مع التأخيرات المحتملة
};

export const pool = new Pool(poolOptions);

// إنشاء مثيل Drizzle ORM
export const db = drizzle({ client: pool, schema });

// إضافة معالجة الأخطاء وإعادة المحاولة للاتصال
// استمع إلى أحداث الخطأ لتسجيلها ومعالجتها
pool.on('error', (err: any) => {
  console.error('Database pool error:', err);
  
  // محاولة إعادة إنشاء الاتصال في حالة حدوث خطأ
  // إعادة محاولة الاتصال بعد فترة قصيرة
  if (err && typeof err === 'object' && 'code' in err && 
     (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND')) {
    console.log('✔️ إعادة محاولة الاتصال بقاعدة البيانات بعد خطأ:', err.code);
    // إعادة محاولة الاتصال بعد ثانيتين
    setTimeout(() => {
      checkDatabaseConnection().then(connected => {
        if (connected) {
          console.log('✅ تم إعادة الاتصال بقاعدة البيانات بنجاح');
        }
      });
    }, 2000);
  }
});

// دالة مساعدة للتحقق من حالة اتصال قاعدة البيانات
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('✅ Database connection is working');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

/**
 * إحاطة استعلامات قاعدة البيانات بمعالجة الأخطاء وإعادة المحاولة
 * هذه الدالة ستساعد في تقليل الأخطاء الظاهرة للمستخدم النهائي والمحاولة تلقائيًا
 * 
 * @param fn دالة الاستعلام التي تتفاعل مع قاعدة البيانات
 * @param retries عدد محاولات إعادة المحاولة المسموحة
 * @param delay التأخير بين المحاولات (بالملي ثانية)
 * @returns نتيجة الاستعلام أو قيمة افتراضية في حالة الفشل
 */
export async function withDatabaseRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000, defaultValue?: T): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // تجاهل المحاولة الأخيرة - لا داعي للانتظار
      if (attempt < retries) {
        const isConnectionError = error && typeof error === 'object' && 'code' in error && (
                               error.code === 'ECONNREFUSED' || 
                               error.code === 'ETIMEDOUT' || 
                               error.code === 'ENOTFOUND' ||
                               error.code === '57P01'); // SQL state code for admin shutdown
        
        if (isConnectionError) {
          console.log(`⚠️ فشل الاتصال بقاعدة البيانات. إعادة المحاولة ${attempt + 1}/${retries}`);
          // انتظر قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, delay));
          // زيادة فترة الانتظار مع كل محاولة فاشلة (استراتيجية backoff)
          delay = Math.min(delay * 1.5, 10000); // الحد الأقصى 10 ثواني
          continue;
        }
      }
      
      // للأخطاء الأخرى، نسجلها فقط ونعيد رميها
      console.error('❌ خطأ في استعلام قاعدة البيانات:', error);
      
      // إذا تم توفير قيمة افتراضية، نعيدها بدلاً من رمي الخطأ
      if (defaultValue !== undefined) {
        console.log('ℹ️ استخدام القيمة الافتراضية بدلاً من رمي الخطأ');
        return defaultValue;
      }
      
      throw error;
    }
  }
  
  // لن نصل إلى هنا أبدًا، ولكن TypeScript يتطلب إرجاع قيمة
  throw lastError;
}