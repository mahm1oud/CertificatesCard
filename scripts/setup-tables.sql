-- هذا الملف يقوم بإنشاء الجداول الأساسية في قاعدة البيانات

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- إنشاء جدول التصنيفات
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

-- إنشاء جدول القوالب
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

-- إنشاء جدول حقول القوالب
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

-- إنشاء جدول settings
CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_by" INTEGER REFERENCES "users"("id"),
  CONSTRAINT "category_key_idx" UNIQUE ("category", "key")
);

-- إضافة تعليق بنهاية الملف للإشارة إلى اكتمال الجداول الأساسية
-- جداول إضافية (مثل الشهادات والبطاقات) ستضاف لاحقًا بواسطة Drizzle