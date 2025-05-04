/**
 * سكريبت لتحديث كلمة مرور المستخدم admin
 * هذا السكريبت اختياري ويمكن تشغيله من سطر الأوامر
 */

import { pool } from "../server/db";
import { hashPassword } from "../server/auth";

async function updateAdminPassword() {
  try {
    console.log("🔄 جاري تحديث كلمة مرور مستخدم admin...");
    
    // إنشاء اتصال بقاعدة البيانات
    const client = await pool.connect();
    
    try {
      // التحقق من وجود المستخدم admin
      const checkResult = await client.query(
        'SELECT * FROM users WHERE username = $1', 
        ['admin']
      );
      
      if (checkResult.rows.length === 0) {
        console.log("❌ مستخدم admin غير موجود!");
        return;
      }
      
      // تشفير كلمة المرور الجديدة
      const hashedPassword = await hashPassword("700700");
      
      // تحديث كلمة المرور
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      
      console.log("✅ تم تحديث كلمة مرور مستخدم admin بنجاح");
      console.log("Username: admin");
      console.log("Password: 700700");
    } finally {
      // إغلاق الاتصال
      client.release();
    }
  } catch (error) {
    console.error("❌ خطأ في تحديث كلمة مرور مستخدم admin:", error);
  } finally {
    // إنهاء المجمع
    pool.end();
  }
}

// تنفيذ الدالة
updateAdminPassword();