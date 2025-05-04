import { db } from "../server/db";
import { users, templates, categories } from "../shared/schema";
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
      password: hashedPassword,
      fullName: "مدير النظام",
      email: "admin@example.com",
      isAdmin: true
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

/**
 * سكريبت لإنشاء قوالب عينة
 */
async function seedTemplates() {
  try {
    console.log("🌱 جاري التحقق من وجود قوالب...");
    
    // التحقق مما إذا كانت القوالب موجودة بالفعل
    const existingTemplates = await db.select().from(templates).limit(1).execute();
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log("✅ القوالب موجودة بالفعل، تخطي الإنشاء");
      return;
    }
    
    // الحصول على التصنيفات
    const categoriesList = await db.select().from(categories).execute();
    
    if (!categoriesList || categoriesList.length === 0) {
      console.log("❌ لا توجد تصنيفات، يرجى إنشاء تصنيفات أولاً");
      return;
    }
    
    // قالب شهادة تقدير أساسي
    const templateBasicAppreciation = {
      title: "شهادة تقدير أساسية",
      titleAr: "شهادة تقدير أساسية",
      slug: "basic-appreciation",
      categoryId: categoriesList[0].id,
      imageUrl: "/static/templates/basic-appreciation.jpg",
      thumbnailUrl: "/static/templates/thumbnails/basic-appreciation-thumb.jpg",
      displayOrder: 1,
      fields: JSON.stringify([
        "recipient_name",
        "course_name", 
        "date",
        "instructor_name",
        "instructor_signature"
      ]),
      defaultValues: JSON.stringify({
        "course_name": "دورة تدريبية",
        "instructor_name": "اسم المدرب"
      }),
      settings: JSON.stringify({
        "fontFamily": "Cairo",
        "backgroundColor": "#ffffff",
        "primaryColor": "#2563eb"
      }),
      active: true
    };
    
    // قالب شهادة إنجاز تقني
    const templateTechAchievement = {
      title: "شهادة إنجاز تقني",
      titleAr: "شهادة إنجاز تقني",
      slug: "tech-achievement",
      categoryId: categoriesList[0].id,
      imageUrl: "/static/templates/tech-achievement.jpg",
      thumbnailUrl: "/static/templates/thumbnails/tech-achievement-thumb.jpg",
      displayOrder: 2,
      fields: JSON.stringify([
        "recipient_name",
        "achievement",
        "date",
        "instructor_name",
        "instructor_signature",
        "company_logo"
      ]),
      defaultValues: JSON.stringify({
        "achievement": "إتمام دورة البرمجة بلغة جافاسكريبت",
        "instructor_name": "اسم المدرب"
      }),
      settings: JSON.stringify({
        "fontFamily": "Cairo",
        "backgroundColor": "#f8fafc",
        "primaryColor": "#0891b2"
      }),
      active: true
    };
    
    // قالب شهادة دورة تسويقية
    const templateMarketingCourse = {
      title: "شهادة دورة تسويقية",
      titleAr: "شهادة دورة تسويقية",
      slug: "marketing-course",
      categoryId: categoriesList[1].id,
      imageUrl: "/static/templates/marketing-course.jpg",
      thumbnailUrl: "/static/templates/thumbnails/marketing-course-thumb.jpg",
      displayOrder: 3,
      fields: JSON.stringify([
        "recipient_name",
        "course_name",
        "hours",
        "date_from",
        "date_to",
        "instructor_name",
        "instructor_signature",
        "company_logo"
      ]),
      defaultValues: JSON.stringify({
        "course_name": "دورة التسويق الرقمي",
        "hours": "30",
        "instructor_name": "اسم المدرب"
      }),
      settings: JSON.stringify({
        "fontFamily": "Tajawal",
        "backgroundColor": "#ffffff",
        "primaryColor": "#be185d"
      }),
      active: true
    };
    
    // إدخال القوالب في قاعدة البيانات
    await db.insert(templates).values([
      templateBasicAppreciation,
      templateTechAchievement,
      templateMarketingCourse
    ]).execute();
    
    console.log("✅ تم إنشاء القوالب بنجاح");
    return true;
  } catch (error) {
    console.error("❌ خطأ في إنشاء القوالب:", error);
    throw error;
  }
}

// تنفيذ سكريبت التهيئة
async function main() {
  console.log("🚀 بدء تهيئة قاعدة البيانات...");
  
  // إنشاء المستخدم الافتراضي
  await seedDefaultAdmin();
  
  // إنشاء القوالب
  await seedTemplates();
  
  console.log("✨ اكتملت تهيئة قاعدة البيانات بنجاح!");
  process.exit(0);
}

// تشغيل السكريبت
main().catch((error) => {
  console.error("❌ حدث خطأ أثناء تهيئة قاعدة البيانات:", error);
  process.exit(1);
});