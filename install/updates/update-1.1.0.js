/**
 * تحديث للإصدار 1.1.0
 * 
 * يقوم هذا التحديث بإجراء التغييرات التالية:
 * 1. إضافة حقول جديدة لجدول المستخدمين
 * 2. إضافة إعدادات جديدة لجدول الإعدادات
 * 3. تحديث ملفات التطبيق
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * تطبيق التحديث
 */
async function apply(config) {
  console.log('🔄 بدء تطبيق تحديث الإصدار 1.1.0...');
  
  // الاتصال بقاعدة البيانات
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });
  
  try {
    // 1. إضافة حقول جديدة لجدول المستخدمين
    console.log('👤 تحديث جدول المستخدمين...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP NULL DEFAULT NULL;
    `);
    
    // 2. إضافة إعدادات جديدة
    console.log('⚙️ إضافة إعدادات جديدة...');
    await connection.execute(`
      INSERT IGNORE INTO settings (key, value, created_at, updated_at)
      VALUES 
        ('enable_password_expiry', 'false', NOW(), NOW()),
        ('password_expiry_days', '90', NOW(), NOW()),
        ('enable_two_factor_auth', 'false', NOW(), NOW());
    `);
    
    // 3. تحديث ملفات التطبيق (هنا يمكن إضافة أي عمليات تحديث للملفات)
    console.log('📂 تحديث ملفات التطبيق...');
    
    // إنشاء المجلدات المطلوبة للتحديث إذا لم تكن موجودة
    await fs.mkdir(path.join(process.cwd(), 'backups'), { recursive: true });
    await fs.mkdir(path.join(process.cwd(), 'logs/updates'), { recursive: true });
    
    // تسجيل التحديث في سجل التحديثات
    const logFile = path.join(process.cwd(), 'logs/updates/update_1.1.0.log');
    await fs.writeFile(logFile, `تم تطبيق التحديث بتاريخ: ${new Date().toISOString()}\n`);
    
    console.log('✅ تم إكمال تحديث الإصدار 1.1.0 بنجاح!');
  } catch (error) {
    console.error('❌ خطأ أثناء تحديث الإصدار 1.1.0:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  apply
};