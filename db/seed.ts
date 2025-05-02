import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

/**
 * سكريبت لإنشاء مستخدم admin افتراضي عند تهيئة قاعدة البيانات
 * يستخدم اسم المستخدم: admin
 * وكلمة المرور: 700700
 */
async function seedDefaultAdmin() {
  try {
    console.log("🌱 جاري التحقق من وجود مستخدم admin...");
    
    // التحقق مما إذا كان المستخدم موجود بالفعل
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).execute();
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log("✅ مستخدم admin موجود بالفعل، تخطي الإنشاء");
      return;
    }
    
    // إنشاء كلمة مرور مشفرة
    const hashedPassword = await hashPassword("700700");
    
    // إنشاء مستخدم admin جديد
    const newAdmin = {
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "مدير النظام",
      role: "admin",
      active: true,
      verifiedEmail: true,
      locale: "ar",
    };
    
    // إدخال المستخدم في قاعدة البيانات
    const result = await db.insert(users).values(newAdmin).returning();
    
    console.log("✅ تم إنشاء مستخدم admin بنجاح");
    console.log("Username: admin");
    console.log("Password: 700700");
    
    return result[0];
  } catch (error) {
    console.error("❌ خطأ في إنشاء مستخدم admin:", error);
    throw error;
  }
}

// تنفيذ سكريبت التهيئة
async function main() {
  console.log("🚀 بدء تهيئة قاعدة البيانات...");
  
  // إنشاء المستخدم الافتراضي
  await seedDefaultAdmin();
  
  console.log("✨ اكتملت تهيئة قاعدة البيانات بنجاح!");
  process.exit(0);
}

// تشغيل السكريبت
main().catch((error) => {
  console.error("❌ حدث خطأ أثناء تهيئة قاعدة البيانات:", error);
  process.exit(1);
});