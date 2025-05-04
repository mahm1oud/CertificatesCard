// ملف إعدادات Drizzle ORM للتوافق مع MySQL
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// تحميل المتغيرات البيئية من ملف .env
dotenv.config();

// التحقق من وجود رابط قاعدة البيانات
if (!process.env.DB_URL) {
  throw new Error('DATABASE_URL غير محدد في متغيرات البيئة');
}

export default {
  schema: './shared/schema.ts',
  out: './db/migrations',
  driver: 'mysql2',
  dbCredentials: {
    uri: process.env.DB_URL || ''
  },
  // لتخصيص خيارات التحويل لـ MySQL
  mysql: {
    foreignRelations: true,    // دعم العلاقات الخارجية
    explicitPrimaryKeys: true  // تحديد المفاتيح الأساسية بشكل صريح
  }
} satisfies Config;