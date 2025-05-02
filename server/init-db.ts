/**
 * سكريبت تهيئة قاعدة البيانات - يتم تنفيذه عند بدء تشغيل التطبيق
 * يتحقق من وجود مستخدم admin وينشئه إذا لم يكن موجوداً
 * أو يحدث كلمة المرور إلى القيمة الافتراضية (700700) إذا لزم الأمر
 */

import { pool, withDatabaseRetry } from "./db";
import { hashPassword, comparePasswords } from "./auth";

/**
 * إنشاء مستخدم admin افتراضي إذا لم يكن موجوداً
 * تستخدم استراتيجية إعادة المحاولة للتعامل مع مشكلات الاتصال
 */
export async function ensureDefaultAdminExists() {
  try {
    console.log("🔄 التحقق من وجود مستخدم admin...");
    
    // استخدام استراتيجية إعادة المحاولة
    return await withDatabaseRetry(async () => {
      // استخدام اتصال مباشر بقاعدة البيانات بدلاً من Drizzle ORM
      const client = await pool.connect();
      
      try {
        // كلمة المرور الموحدة
        const defaultPassword = "700700";
        // تشفير كلمة المرور
        const hashedPassword = await hashPassword(defaultPassword);
        
        // التحقق من وجود المستخدم admin
        const checkResult = await client.query(
          'SELECT * FROM users WHERE username = $1', 
          ['admin']
        );
        
        // إذا كان المستخدم غير موجود
        if (checkResult.rows.length === 0) {
          // إنشاء مستخدم admin جديد
          const insertResult = await client.query(
            `INSERT INTO users (username, password, name, role, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING *`,
            ['admin', hashedPassword, 'مدير النظام', 'admin']
          );
          
          console.log("✅ تم إنشاء مستخدم admin افتراضي بنجاح");
          console.log("Username: admin");
          console.log("Password: 700700");
          
          return insertResult.rows[0];
        } else {
          // المستخدم موجود، تحديث كلمة المرور
          await client.query(
            'UPDATE users SET password = $1 WHERE username = $2',
            [hashedPassword, 'admin']
          );
          
          console.log("✅ تم التحقق من وجود مستخدم admin وتحديث كلمة المرور");
          console.log("Username: admin");
          console.log("Password: 700700");
          
          return checkResult.rows[0];
        }
      } finally {
        // إرجاع الاتصال إلى المجمّع بعد الانتهاء
        client.release();
      }
    }, 3, 2000); // 3 محاولات، بمدة انتظار 2 ثانية بين كل محاولة
  } catch (error) {
    console.error("❌ خطأ في التحقق من/إنشاء مستخدم admin:", error);
    // نتجاهل الخطأ لضمان استمرار تشغيل التطبيق
    return null;
  }
}