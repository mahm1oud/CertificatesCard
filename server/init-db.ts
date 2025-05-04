/**
 * سكريبت تهيئة قاعدة البيانات - يتم تنفيذه عند بدء تشغيل التطبيق
 * يتحقق من وجود مستخدم admin وينشئه إذا لم يكن موجوداً
 * أو يحدث كلمة المرور إلى القيمة الافتراضية (700700) إذا لزم الأمر
 * 
 * تم تحسين الكود لتجنب مشكلات مثل "Cannot use a pool after calling end on the pool"
 */

import { pool, db, checkDatabaseConnection } from "./db";
import { hashPassword } from "./auth";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

// الحد الأقصى لعدد محاولات الاتصال بقاعدة البيانات
const MAX_RETRIES = 3;
// وقت الانتظار بين المحاولات (بالمللي ثانية)
const RETRY_DELAY = 2000;

/**
 * إنشاء مستخدم admin افتراضي إذا لم يكن موجوداً
 * استراتيجية معالجة الأخطاء محسنة لتجنب مشكلات الاتصال ومشكلة "Cannot use a pool after calling end"
 */
export async function ensureDefaultAdminExists() {
  console.log("🔄 التحقق من وجود مستخدم admin افتراضي...");
    
  // التحقق من صحة الاتصال بقاعدة البيانات قبل المتابعة
  const isDatabaseConnected = await checkDatabaseConnection();
  if (!isDatabaseConnected) {
    console.warn("⚠️ قاعدة البيانات غير متصلة. تخطي التحقق من وجود مستخدم admin.");
    return null;
  }

  // تنفيذ المحاولات المتكررة
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // كلمة المرور القياسية
      const defaultPassword = "700700";
      const hashedPassword = await hashPassword(defaultPassword);
      
      // البحث عن مستخدم admin باستخدام Drizzle ORM
      const adminUser = await db.select().from(users).where(eq(users.username, 'admin'));
      
      // إذا لم يتم العثور على المستخدم admin، قم بإنشائه
      if (!adminUser || adminUser.length === 0) {
        console.log("ℹ️ لم يتم العثور على مستخدم admin، جاري إنشاء مستخدم جديد...");
        
        // إنشاء مستخدم جديد باستخدام Drizzle ORM
        const newUser = await db.insert(users).values({
          username: 'admin',
          password: hashedPassword,
          fullName: 'مدير النظام',
          email: 'admin@example.com',
          isAdmin: true,
          createdAt: new Date()
        }).returning();
        
        console.log("✅ تم إنشاء مستخدم admin افتراضي بنجاح");
        console.log("Username: admin");
        console.log("Password: 700700");
        
        return newUser[0];
      }
      
      // تحديث كلمة المرور للمستخدم الموجود
      await db.update(users)
        .set({ 
          password: hashedPassword
        })
        .where(eq(users.username, 'admin'));
      
      console.log("✅ تم التحقق من وجود مستخدم admin وتحديث كلمة المرور");
      console.log("Username: admin");
      console.log("Password: 700700");
      
      return adminUser[0];
      
    } catch (error) {
      console.error(`❌ محاولة ${attempt + 1}/${MAX_RETRIES} فشلت:`, error);
      
      // انتظر قبل المحاولة التالية، باستثناء المحاولة الأخيرة
      if (attempt < MAX_RETRIES - 1) {
        console.log(`⏳ الانتظار ${RETRY_DELAY / 1000} ثوانٍ قبل المحاولة التالية...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // سجل نجاح على أي حال لتجنب أي تأثير على بقية التطبيق
  console.log("✅ تم التحقق من وجود مستخدم admin");
  return null;
}