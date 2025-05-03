import { db } from "./server/db";
import { sql } from "drizzle-orm";
import * as schema from "./shared/schema";

// دالة للتحقق من وجود جدول في قاعدة البيانات
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      );
    `);
    // PostgreSQL قد يعيد القيمة كنص 't' أو 'f' أو كقيمة boolean
    const exists = result.rows[0].exists;
    if (typeof exists === 'boolean') return exists;
    if (typeof exists === 'string') return exists === 't' || exists === 'true';
    return false; // في حالة عدم التعرف على النوع
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// إنشاء الجداول إذا لم تكن موجودة
async function createTables() {
  try {
    // التحقق من وجود جدول users
    const usersTableExists = await tableExists('users');
    if (!usersTableExists) {
      // لنتأكد من استخدام صيغة SQL صحيحة لتجنب التعارضات المحتملة
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "role" TEXT NOT NULL DEFAULT 'user',
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP
        );
      `);
      console.log('✅ تم إنشاء جدول المستخدمين');
    } else {
      console.log('ℹ️ جدول المستخدمين موجود بالفعل');
    }

    // التحقق من وجود جدول categories
    const categoriesTableExists = await tableExists('categories');
    if (!categoriesTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "name_ar" TEXT,
          "slug" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "description_ar" TEXT,
          "display_order" INTEGER NOT NULL DEFAULT 0,
          "icon" TEXT,
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ تم إنشاء جدول التصنيفات');
    } else {
      console.log('ℹ️ جدول التصنيفات موجود بالفعل');
    }

    // التحقق من وجود جدول templates
    const templatesTableExists = await tableExists('templates');
    if (!templatesTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "templates" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "title_ar" TEXT,
          "slug" TEXT NOT NULL,
          "category_id" INTEGER NOT NULL REFERENCES "categories"("id"),
          "image_url" TEXT NOT NULL,
          "thumbnail_url" TEXT,
          "display_order" INTEGER NOT NULL DEFAULT 0,
          "fields" JSONB NOT NULL DEFAULT '[]',
          "default_values" JSONB DEFAULT '{}',
          "settings" JSONB DEFAULT '{}',
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ تم إنشاء جدول القوالب');
    } else {
      console.log('ℹ️ جدول القوالب موجود بالفعل');
    }

    console.log('✅ تم إنشاء الجداول الأساسية');
    return true;
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    return false;
  }
}

// تشغيل الوظيفة لإنشاء الجداول
async function main() {
  try {
    console.log('🚀 بدء إنشاء هيكل قاعدة البيانات...');
    await createTables();
    console.log('✨ تم إنشاء هيكل قاعدة البيانات بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إنشاء قاعدة البيانات:', error);
    process.exit(1);
  }
}

main();