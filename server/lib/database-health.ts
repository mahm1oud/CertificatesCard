/**
 * وحدة للتحقق من صحة قاعدة البيانات وإصلاحها
 * توفر وظائف للتحقق من حالة الاتصال بقاعدة البيانات وإصلاح المشاكل تلقائيًا
 */

import { pool } from '../db';

// عدد محاولات إعادة الاتصال التلقائية
const MAX_AUTO_RECONNECT_ATTEMPTS = 3;

// مفتاح الحالة العامة لقاعدة البيانات
export type DatabaseHealthStatus = {
  status: 'ok' | 'error' | 'recovering' | 'critical';
  message: string;
  timestamp: Date;
  connectionTime?: number; // وقت الاستجابة بالملي ثانية
  details?: Record<string, any>;
  recoveryAttempts?: number;
};

/**
 * التحقق من صحة قاعدة البيانات
 * يجري اختبارًا على قاعدة البيانات ويتحقق من صحتها
 * 
 * @returns حالة صحة قاعدة البيانات
 */
export async function performDatabaseHealthCheck(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();
  
  try {
    // محاولة الاتصال بقاعدة البيانات وتنفيذ استعلام بسيط
    const client = await pool.connect();
    
    try {
      // تنفيذ استعلام بسيط للتحقق من الاتصال
      const result = await client.query('SELECT 1 as connection_test');
      
      // حساب وقت الاستجابة
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // التحقق من النتيجة
      if (result.rows[0]?.connection_test === 1) {
        return {
          status: 'ok',
          message: 'قاعدة البيانات تعمل بشكل جيد',
          timestamp: new Date(),
          connectionTime: responseTime,
          details: {
            poolSize: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingCount: pool.waitingCount,
          },
        };
      } else {
        return {
          status: 'error',
          message: 'تم الاتصال بقاعدة البيانات ولكن الاستعلام فشل',
          timestamp: new Date(),
          connectionTime: responseTime,
        };
      }
    } finally {
      // إعادة اتصال العميل إلى المجمع
      client.release();
    }
  } catch (error) {
    console.error('❗ خطأ في التحقق من صحة قاعدة البيانات:', error);
    
    return {
      status: 'error',
      message: `فشل الاتصال بقاعدة البيانات: ${(error as Error).message}`,
      timestamp: new Date(),
      details: { error: (error as Error).message, stack: (error as Error).stack },
    };
  }
}

/**
 * محاولة إصلاح الاتصال بقاعدة البيانات
 * يحاول إعادة إنشاء الاتصال بقاعدة البيانات بعد فشل
 * 
 * @param maxAttempts الحد الأقصى لعدد محاولات إعادة الاتصال
 * @returns حالة الإصلاح
 */
export async function attemptDatabaseRecovery(maxAttempts: number = MAX_AUTO_RECONNECT_ATTEMPTS): Promise<DatabaseHealthStatus> {
  console.log(`🔄 جاري محاولة إصلاح الاتصال بقاعدة البيانات (بحد أقصى ${maxAttempts} محاولات)`);
  
  // حالة لتتبع محاولات الإصلاح
  let recoveryStatus: DatabaseHealthStatus = {
    status: 'recovering',
    message: 'جاري محاولة إعادة الاتصال بقاعدة البيانات',
    timestamp: new Date(),
    recoveryAttempts: 0,
  };
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    recoveryStatus.recoveryAttempts = attempt;
    console.log(`⚠️ محاولة إعادة الاتصال ${attempt}/${maxAttempts}...`);
    
    try {
      // إعادة تهيئة مجمع الاتصالات
      await pool.end();
      
      // انتظار قليل قبل إعادة المحاولة
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
      // اختبار الاتصال الجديد
      const healthStatus = await performDatabaseHealthCheck();
      
      if (healthStatus.status === 'ok') {
        console.log(`✅ تم إصلاح الاتصال بقاعدة البيانات بنجاح (المحاولة ${attempt})`);
        return {
          status: 'ok',
          message: `تم إصلاح الاتصال بقاعدة البيانات بنجاح بعد ${attempt} محاولات`,
          timestamp: new Date(),
          recoveryAttempts: attempt,
          details: healthStatus.details,
        };
      }
    } catch (error) {
      console.error(`❌ فشلت محاولة الإصلاح ${attempt}/${maxAttempts}:`, error);
      // استمر في الحلقة للمحاولة التالية
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع محاولات الإصلاح
  console.error(`❌ فشلت جميع محاولات إصلاح الاتصال بقاعدة البيانات (${maxAttempts} محاولات)`);
  
  return {
    status: 'critical',
    message: `فشلت جميع محاولات إصلاح الاتصال بقاعدة البيانات (${maxAttempts} محاولات)`,
    timestamp: new Date(),
    recoveryAttempts: maxAttempts,
  };
}

/**
 * اختبار الاتصال بقاعدة البيانات
 * اختبار بسيط للتحقق من صحة قاعدة البيانات
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // الحصول على عميل من المجمع
    const client = await pool.connect();
    
    try {
      // تنفيذ استعلام بسيط
      const result = await client.query('SELECT 1');
      return result.rowCount === 1;
    } finally {
      // إعادة العميل إلى المجمع
      client.release();
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    return false;
  }
}

/**
 * هذه الدالة تقوم باختبار الاتصال بقاعدة البيانات بشكل دوري
 * مما يساعد على الكشف المبكر عن مشاكل الاتصال
 * 
 * @param intervalSeconds مدة الفترة بين الاختبارات بالثواني
 */
export function setupPeriodicDatabaseHealthCheck(intervalSeconds: number = 300): NodeJS.Timeout {
  console.log(`🕐 تم إعداد التحقق الدوري من صحة قاعدة البيانات كل ${intervalSeconds} ثانية`);
  
  return setInterval(async () => {
    console.log('🕐 جاري التحقق الدوري من صحة قاعدة البيانات...');
    
    const healthStatus = await performDatabaseHealthCheck();
    
    if (healthStatus.status !== 'ok') {
      console.warn(`⚠️ اكتشف التحقق الدوري مشكلة في قاعدة البيانات: ${healthStatus.message}`);
      
      // محاولة إصلاح تلقائي
      const recoveryStatus = await attemptDatabaseRecovery();
      
      if (recoveryStatus.status === 'ok') {
        console.log('✅ تم إصلاح الاتصال بقاعدة البيانات تلقائيًا');
      } else {
        console.error('❌ فشلت محاولة الإصلاح التلقائي لقاعدة البيانات');
        
        // هنا يمكن إضافة رمز للإشعار عن المشكلة للمشرفين
      }
    } else {
      console.log('✅ قاعدة البيانات تعمل بشكل جيد');
    }
  }, intervalSeconds * 1000);
}

/**
 * جدولة التحققات الدورية لصحة قاعدة البيانات
 * تبدأ التحققات الدورية وترجع مقبض المؤقت
 * 
 * @returns مقبض مؤقت للتحقق الدوري
 */
export function scheduleHealthChecks(): { timer: NodeJS.Timeout } {
  console.log('📆 جدولة التحققات الدورية لصحة قاعدة البيانات');
  
  // تنفيذ فحص مبدئي عند بدء التطبيق
  setTimeout(async () => {
    try {
      const initialHealth = await performDatabaseHealthCheck();
      console.log(`ℹ️ نتيجة الفحص المبدئي لقاعدة البيانات: ${initialHealth.status}`);
      
      if (initialHealth.status !== 'ok') {
        console.warn('⚠️ قاعدة البيانات ليست بحالة جيدة عند بدء التطبيق');
        
        // محاولة إصلاح فورية
        const recoveryStatus = await attemptDatabaseRecovery();
        console.log(`ℹ️ نتيجة محاولة الإصلاح الفورية: ${recoveryStatus.status}`);
      }
    } catch (error) {
      console.error('❌ خطأ أثناء الفحص المبدئي لقاعدة البيانات:', error);
    }
  }, 2000); // تأخير للسماح ببدء التطبيق بالكامل
  
  // بدء التحقق الدوري كل 5 دقائق
  const timer = setupPeriodicDatabaseHealthCheck(300); // 300 ثانية = 5 دقائق
  
  return { timer };
}