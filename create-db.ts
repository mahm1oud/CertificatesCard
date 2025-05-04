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
          "options" JSONB DEFAULT '{}',
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ تم إنشاء جدول القوالب');
    } else {
      console.log('ℹ️ جدول القوالب موجود بالفعل');
    }

    // التحقق من وجود جدول template_fields
    const templateFieldsTableExists = await tableExists('template_fields');
    if (!templateFieldsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "template_fields" (
          "id" SERIAL PRIMARY KEY,
          "template_id" INTEGER NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
          "name" TEXT NOT NULL,
          "label" TEXT NOT NULL,
          "label_ar" TEXT,
          "type" TEXT NOT NULL DEFAULT 'text',
          "image_type" TEXT,
          "required" BOOLEAN NOT NULL DEFAULT FALSE,
          "default_value" TEXT,
          "placeholder" TEXT,
          "placeholder_ar" TEXT,
          "options" JSONB DEFAULT '[]',
          "position" JSONB DEFAULT '{}',
          "style" JSONB DEFAULT '{}',
          "display_order" INTEGER NOT NULL DEFAULT 0
        );
      `);
      console.log('✅ تم إنشاء جدول حقول القوالب');
    } else {
      console.log('ℹ️ جدول حقول القوالب موجود بالفعل');
    }

    // التحقق من وجود جدول fonts
    const fontsTableExists = await tableExists('fonts');
    if (!fontsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "fonts" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "name_ar" TEXT,
          "family" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'google',
          "url" TEXT,
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "is_rtl" BOOLEAN NOT NULL DEFAULT FALSE,
          "display_order" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ تم إنشاء جدول الخطوط');
    } else {
      console.log('ℹ️ جدول الخطوط موجود بالفعل');
    }

    // التحقق من وجود جدول cards
    const cardsTableExists = await tableExists('cards');
    if (!cardsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "cards" (
          "id" SERIAL PRIMARY KEY,
          "template_id" INTEGER NOT NULL REFERENCES "templates"("id"),
          "user_id" INTEGER REFERENCES "users"("id"),
          "form_data" JSONB NOT NULL,
          "image_url" TEXT NOT NULL,
          "thumbnail_url" TEXT,
          "category_id" INTEGER NOT NULL REFERENCES "categories"("id"),
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "last_accessed" TIMESTAMP,
          "quality" TEXT DEFAULT 'medium',
          "public_id" TEXT UNIQUE,
          "access_count" INTEGER NOT NULL DEFAULT 0,
          "settings" JSONB DEFAULT '{}',
          "status" TEXT NOT NULL DEFAULT 'active'
        );
      `);
      console.log('✅ تم إنشاء جدول البطاقات');
    } else {
      console.log('ℹ️ جدول البطاقات موجود بالفعل');
    }

    // التحقق من وجود جدول certificates
    const certificatesTableExists = await tableExists('certificates');
    if (!certificatesTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "certificates" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "title_ar" TEXT,
          "template_id" INTEGER NOT NULL REFERENCES "templates"("id"),
          "user_id" INTEGER REFERENCES "users"("id"),
          "certificate_type" TEXT NOT NULL DEFAULT 'appreciation',
          "form_data" JSONB NOT NULL,
          "image_url" TEXT NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "expiry_date" DATE,
          "status" TEXT NOT NULL DEFAULT 'active',
          "issued_to" TEXT,
          "issued_to_gender" TEXT DEFAULT 'male',
          "verification_code" TEXT UNIQUE,
          "public_id" TEXT UNIQUE
        );
      `);
      console.log('✅ تم إنشاء جدول الشهادات');
    } else {
      console.log('ℹ️ جدول الشهادات موجود بالفعل');
    }

    // التحقق من وجود جدول certificate_batches
    const certificateBatchesTableExists = await tableExists('certificate_batches');
    if (!certificateBatchesTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "certificate_batches" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "user_id" INTEGER REFERENCES "users"("id"),
          "template_id" INTEGER NOT NULL REFERENCES "templates"("id"),
          "status" TEXT NOT NULL DEFAULT 'pending',
          "total_items" INTEGER NOT NULL DEFAULT 0,
          "processed_items" INTEGER NOT NULL DEFAULT 0,
          "source_type" TEXT NOT NULL DEFAULT 'excel',
          "source_data" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "completed_at" TIMESTAMP
        );
      `);
      console.log('✅ تم إنشاء جدول مجموعات الشهادات');
    } else {
      console.log('ℹ️ جدول مجموعات الشهادات موجود بالفعل');
    }

    // التحقق من وجود جدول certificate_batch_items
    const certificateBatchItemsTableExists = await tableExists('certificate_batch_items');
    if (!certificateBatchItemsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "certificate_batch_items" (
          "id" SERIAL PRIMARY KEY,
          "batch_id" INTEGER NOT NULL REFERENCES "certificate_batches"("id") ON DELETE CASCADE,
          "certificate_id" INTEGER REFERENCES "certificates"("id"),
          "status" TEXT NOT NULL DEFAULT 'pending',
          "form_data" JSONB NOT NULL,
          "error_message" TEXT,
          "row_number" INTEGER,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "processed_at" TIMESTAMP
        );
      `);
      console.log('✅ تم إنشاء جدول عناصر مجموعات الشهادات');
    } else {
      console.log('ℹ️ جدول عناصر مجموعات الشهادات موجود بالفعل');
    }

    // التحقق من وجود جدول settings
    const settingsTableExists = await tableExists('settings');
    if (!settingsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "settings" (
          "id" SERIAL PRIMARY KEY,
          "key" TEXT NOT NULL,
          "value" JSONB NOT NULL,
          "category" TEXT NOT NULL DEFAULT 'general',
          "description" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_by" INTEGER REFERENCES "users"("id"),
          UNIQUE ("category", "key")
        );
      `);
      console.log('✅ تم إنشاء جدول الإعدادات');
    } else {
      console.log('ℹ️ جدول الإعدادات موجود بالفعل');
    }

    // التحقق من وجود جدول auth_settings
    const authSettingsTableExists = await tableExists('auth_settings');
    if (!authSettingsTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "auth_settings" (
          "id" SERIAL PRIMARY KEY,
          "provider" TEXT NOT NULL,
          "client_id" TEXT,
          "client_secret" TEXT,
          "redirect_uri" TEXT,
          "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
          "settings" JSONB DEFAULT '{}',
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_by" INTEGER REFERENCES "users"("id")
        );
      `);
      console.log('✅ تم إنشاء جدول إعدادات المصادقة');
    } else {
      console.log('ℹ️ جدول إعدادات المصادقة موجود بالفعل');
    }

    // التحقق من وجود جدول layers
    const layersTableExists = await tableExists('layers');
    if (!layersTableExists) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "layers" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "name_ar" TEXT,
          "template_id" INTEGER NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
          "type" TEXT NOT NULL DEFAULT 'field',
          "field_name" TEXT,
          "visibility" BOOLEAN NOT NULL DEFAULT TRUE,
          "z_index" INTEGER NOT NULL DEFAULT 0,
          "position" JSONB DEFAULT '{}',
          "style" JSONB DEFAULT '{}',
          "properties" JSONB DEFAULT '{}'
        );
      `);
      console.log('✅ تم إنشاء جدول الطبقات');
    } else {
      console.log('ℹ️ جدول الطبقات موجود بالفعل');
    }

    console.log('✅ تم إنشاء جميع الجداول الأساسية');
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