#!/usr/bin/env node

/**
 * سكربت تحديث اتصال قاعدة البيانات في ملف server/db.ts
 * يقوم هذا السكربت بتحديث ملف اتصال قاعدة البيانات ليستخدم MySQL بدلاً من PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// تهيئة واجهة التفاعل مع المستخدم
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// المسارات المهمة
const serverDbPath = path.join(process.cwd(), 'server', 'db.ts');
const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');

// قراءة الإعدادات من ملف .env
function getEnvVars() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('\x1b[33m%s\x1b[0m', 'لم يتم العثور على ملف .env، سيتم استخدام الإعدادات الافتراضية');
      return {
        DB_TYPE: 'mysql',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USER: 'root',
        DB_PASSWORD: '',
        DB_NAME: 'certificates'
      };
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // إزالة علامات التنصيص إذا وجدت
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    });

    return {
      DB_TYPE: envVars.DB_TYPE || 'mysql',
      DB_HOST: envVars.DB_HOST || 'localhost',
      DB_PORT: envVars.DB_PORT || '3306',
      DB_USER: envVars.DB_USER || 'root',
      DB_PASSWORD: envVars.DB_PASSWORD || '',
      DB_NAME: envVars.DB_NAME || 'certificates'
    };
  } catch (error) {
    console.error('خطأ في قراءة ملف .env:', error);
    return {
      DB_TYPE: 'mysql',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'certificates'
    };
  }
}

// تحديث ملف db.ts لاستخدام MySQL
function updateDbFile(dbVars) {
  try {
    if (!fs.existsSync(serverDbPath)) {
      console.error('\x1b[31m%s\x1b[0m', `الملف ${serverDbPath} غير موجود`);
      return false;
    }

    let content = fs.readFileSync(serverDbPath, 'utf-8');

    // استبدال استيرادات PostgreSQL بـ MySQL
    content = content.replace(
      /import { Pool } from ['"]pg['"];?/g,
      `import mysql from 'mysql2/promise';`
    );

    content = content.replace(
      /import { drizzle } from ['"]drizzle-orm\/postgres-js['"];?/g,
      `import { drizzle } from 'drizzle-orm/mysql2';`
    );

    // استبدال تكوين الاتصال
    const poolConfig = `// تكوين اتصال MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '${dbVars.DB_HOST}',
  port: parseInt(process.env.DB_PORT || '${dbVars.DB_PORT}', 10),
  user: process.env.DB_USER || '${dbVars.DB_USER}',
  password: process.env.DB_PASSWORD || '${dbVars.DB_PASSWORD}',
  database: process.env.DB_NAME || '${dbVars.DB_NAME}',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});`;

    // استبدال إعدادات Pool
    content = content.replace(
      /let pool: Pool;[\s\S]*?};?/gm,
      poolConfig
    );

    // استبدال دالة فحص الاتصال
    const checkConnection = `export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('📊 تم الاتصال بقاعدة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    return false;
  }
}`;

    content = content.replace(
      /export async function checkDatabaseConnection[\s\S]*?}/g,
      checkConnection
    );

    fs.writeFileSync(serverDbPath, content, 'utf-8');
    console.log('\x1b[32m%s\x1b[0m', `✅ تم تحديث ملف ${serverDbPath} بنجاح`);
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `خطأ في تحديث ملف db.ts:`, error);
    return false;
  }
}

// تحديث ملف schema.ts لاستخدام MySQL
function updateSchemaFile() {
  try {
    if (!fs.existsSync(schemaPath)) {
      console.error('\x1b[31m%s\x1b[0m', `الملف ${schemaPath} غير موجود`);
      return false;
    }

    // نسخ ملف الشيما الجديد
    const newSchemaPath = path.join(process.cwd(), 'install', 'config', 'mysql.schema.ts');
    if (!fs.existsSync(newSchemaPath)) {
      console.error('\x1b[31m%s\x1b[0m', `ملف الشيما الجديد غير موجود: ${newSchemaPath}`);
      return false;
    }

    // عمل نسخة احتياطية من الملف الأصلي
    const backupPath = `${schemaPath}.backup-${Date.now()}`;
    fs.copyFileSync(schemaPath, backupPath);
    console.log('\x1b[33m%s\x1b[0m', `تم عمل نسخة احتياطية من الملف الأصلي في: ${backupPath}`);

    // نسخ الملف الجديد
    fs.copyFileSync(newSchemaPath, schemaPath);
    console.log('\x1b[32m%s\x1b[0m', `✅ تم تحديث ملف ${schemaPath} بنجاح`);
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `خطأ في تحديث ملف schema.ts:`, error);
    return false;
  }
}

// تحديث ملف drizzle.config.ts
function updateDrizzleConfig() {
  try {
    if (!fs.existsSync(drizzleConfigPath)) {
      console.error('\x1b[31m%s\x1b[0m', `الملف ${drizzleConfigPath} غير موجود`);
      return false;
    }

    // نسخ ملف التكوين الجديد
    const newConfigPath = path.join(process.cwd(), 'install', 'config', 'drizzle.mysql.config.ts');
    if (!fs.existsSync(newConfigPath)) {
      console.error('\x1b[31m%s\x1b[0m', `ملف التكوين الجديد غير موجود: ${newConfigPath}`);
      return false;
    }

    // عمل نسخة احتياطية من الملف الأصلي
    const backupPath = `${drizzleConfigPath}.backup-${Date.now()}`;
    fs.copyFileSync(drizzleConfigPath, backupPath);
    console.log('\x1b[33m%s\x1b[0m', `تم عمل نسخة احتياطية من الملف الأصلي في: ${backupPath}`);

    // نسخ الملف الجديد
    fs.copyFileSync(newConfigPath, drizzleConfigPath);
    console.log('\x1b[32m%s\x1b[0m', `✅ تم تحديث ملف ${drizzleConfigPath} بنجاح`);
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `خطأ في تحديث ملف drizzle.config.ts:`, error);
    return false;
  }
}

// التنفيذ الرئيسي
async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🔄 جاري تحديث إعدادات قاعدة البيانات لاستخدام MySQL...');
  
  // استخراج معلومات قاعدة البيانات من ملف .env
  const dbVars = getEnvVars();
  
  // طلب تأكيد من المستخدم
  rl.question('\x1b[33m⚠️ هذا السكربت سيقوم بتحديث ملفات التطبيق لاستخدام MySQL. هل تريد المتابعة؟ (نعم/لا) \x1b[0m', (answer) => {
    if (answer.toLowerCase() !== 'نعم' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('\x1b[33m%s\x1b[0m', '❌ تم إلغاء العملية بواسطة المستخدم');
      rl.close();
      return;
    }
    
    // تحديث الملفات
    const dbUpdated = updateDbFile(dbVars);
    const schemaUpdated = updateSchemaFile();
    const drizzleUpdated = updateDrizzleConfig();
    
    if (dbUpdated && schemaUpdated && drizzleUpdated) {
      console.log('\x1b[32m%s\x1b[0m', '✅ تم تحديث جميع الملفات بنجاح. التطبيق الآن جاهز لاستخدام MySQL.');
      console.log('\x1b[33m%s\x1b[0m', 'ملاحظة: يجب تثبيت حزمة mysql2 قبل تشغيل التطبيق باستخدام الأمر: npm install mysql2');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '❌ حدثت أخطاء أثناء تحديث الملفات. يرجى التحقق من سجل الأخطاء أعلاه.');
    }
    
    rl.close();
  });
}

main().catch(error => {
  console.error('\x1b[31m%s\x1b[0m', 'حدث خطأ غير متوقع:', error);
  rl.close();
});