import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  console.log('🚀 إعادة إنشاء قاعدة البيانات...');
  
  // إنشاء اتصال بقاعدة البيانات
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const client = await pool.connect();
  
  try {
    // حذف جميع الجداول الموجودة أولاً للتأكد من إعادة التثبيت
    console.log('🗑️ حذف جميع الجداول الحالية...');
    await client.query(`
      DO $$ 
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              IF r.tablename != 'session' THEN  -- الحفاظ على جدول الجلسات
                  EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
              END IF;
          END LOOP;
      END $$;
    `);
    
    // إنشاء كائن drizzle
    const db = drizzle(pool, { schema });
    
    // تنفيذ استعلامات تهيئة قاعدة البيانات مباشرة
    console.log('🔨 إنشاء هيكل قاعدة البيانات الجديد...');
    
    // لا حاجة للوصول إلى كائنات الجداول مباشرة، يمكننا استخدام الجدول الرئيسي القادم من schema
    const tables = ['users', 'categories', 'templates', 'template_fields', 'cards', 'certificates',
                   'certificate_batches', 'certificate_batch_items', 'fonts', 'settings',
                   'auth_settings', 'layers', 'user_logos', 'user_signatures', 'template_logos'];
    
    
    console.log(`📋 جاري إنشاء الجداول: ${tables.join(', ')}`);
    
    // تنفيذ SQL لإعادة بناء الجداول
    await pool.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle;`);
    
    console.log('✅ اكتمل إعادة إنشاء قاعدة البيانات!');
    
    // استدعاء برنامج seed لإضافة البيانات الأولية
    console.log('🌱 استدعاء برنامج seed لإدخال البيانات الأولية...');
    await import('../db/seed');
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إعادة إنشاء قاعدة البيانات:', error);
    process.exit(1);
  } finally {
    // تحرير الاتصال
    client.release();
    
    // إغلاق الاتصال بقاعدة البيانات
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ خطأ غير متوقع:', err);
  process.exit(1);
});
