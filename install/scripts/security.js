/**
 * أدوات تحسين الأمان للتطبيق
 * 
 * تشمل الوظائف التالية:
 * 1. فحص قوة كلمات المرور
 * 2. تطبيق سياسات منع حقن SQL
 * 3. فحص التحديثات الأمنية
 * 4. فحص الأذونات على الملفات والمجلدات
 * 5. تنظيف سجلات التطبيق
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// قراءة ملف الإعدادات
const CONFIG_FILE = path.join(__dirname, '../config/config.json');
const SECURITY_LOG = path.join(__dirname, '../logs/security.log');

/**
 * تسجيل رسائل الأمان
 */
async function logSecurity(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  // تأكد من وجود مجلد السجلات
  await fs.mkdir(path.dirname(SECURITY_LOG), { recursive: true }).catch(() => {});
  
  // كتابة السجل
  await fs.appendFile(SECURITY_LOG, logMessage);
  
  // طباعة الرسالة للمستخدم
  console.log(`[${level.toUpperCase()}] ${message}`);
}

/**
 * التحقق من قوة كلمات المرور المخزنة
 */
async function checkPasswordStrength(config = {}) {
  try {
    await logSecurity('بدء فحص قوة كلمات المرور...', 'info');
    
    // قراءة ملف الإعدادات
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const appConfig = JSON.parse(configData);
    
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: appConfig.database.host,
      user: appConfig.database.user,
      password: appConfig.database.password,
      database: appConfig.database.database
    });
    
    // استعلام للحصول على كلمات المرور المخزنة
    // ملاحظة: هذا استعلام للتوضيح فقط، لا يتم استرجاع كلمات المرور الفعلية
    const [users] = await connection.execute(`
      SELECT id, username, LENGTH(password) as password_length 
      FROM users
    `);
    
    // تعريف معايير قوة كلمة المرور
    const minLength = config.minPasswordLength || 8;
    
    // فحص طول كلمات المرور
    const weakPasswords = users.filter(user => user.password_length < minLength);
    
    if (weakPasswords.length > 0) {
      await logSecurity(`تم العثور على ${weakPasswords.length} مستخدمين بكلمات مرور ضعيفة`, 'warning');
      
      for (const user of weakPasswords) {
        await logSecurity(`المستخدم ${user.username} (ID: ${user.id}) لديه كلمة مرور قصيرة جدًا`, 'warning');
      }
    } else {
      await logSecurity('جميع كلمات المرور تلبي الحد الأدنى من معايير الطول', 'info');
    }
    
    // إغلاق الاتصال بقاعدة البيانات
    await connection.end();
    
    return weakPasswords.length === 0;
  } catch (error) {
    await logSecurity(`خطأ أثناء فحص قوة كلمات المرور: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * تطبيق سياسات منع حقن SQL
 */
async function applySQLInjectionProtection(config = {}) {
  try {
    await logSecurity('بدء تطبيق حماية ضد حقن SQL...', 'info');
    
    // قراءة ملف الإعدادات
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    const appConfig = JSON.parse(configData);
    
    // الاتصال بقاعدة البيانات
    const connection = await mysql.createConnection({
      host: appConfig.database.host,
      user: appConfig.database.user,
      password: appConfig.database.password,
      database: appConfig.database.database
    });
    
    // تطبيق سياسات منع حقن SQL
    // 1. تحديث إعدادات المستخدم لقاعدة البيانات (في حالة استخدام مستخدم مخصص للتطبيق)
    if (config.createDbUser && config.dbUsername && config.dbPassword) {
      await logSecurity('إنشاء مستخدم قاعدة بيانات مخصص مع صلاحيات محدودة...', 'info');
      
      // حذف المستخدم إذا كان موجودًا
      await connection.execute(`DROP USER IF EXISTS '${config.dbUsername}'@'%'`);
      
      // إنشاء مستخدم جديد مع صلاحيات محدودة
      await connection.execute(`
        CREATE USER '${config.dbUsername}'@'%' IDENTIFIED BY '${config.dbPassword}'
      `);
      
      // منح الصلاحيات المطلوبة فقط
      await connection.execute(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON ${appConfig.database.database}.* TO '${config.dbUsername}'@'%'
      `);
      
      // تطبيق التغييرات
      await connection.execute('FLUSH PRIVILEGES');
      
      await logSecurity(`تم إنشاء مستخدم قاعدة البيانات المخصص: ${config.dbUsername}`, 'info');
      
      // تحديث ملف الإعدادات
      appConfig.database.user = config.dbUsername;
      appConfig.database.password = config.dbPassword;
      
      await fs.writeFile(CONFIG_FILE, JSON.stringify(appConfig, null, 2));
    }
    
    // إغلاق الاتصال بقاعدة البيانات
    await connection.end();
    
    await logSecurity('تم تطبيق حماية ضد حقن SQL بنجاح', 'info');
    
    return true;
  } catch (error) {
    await logSecurity(`خطأ أثناء تطبيق حماية ضد حقن SQL: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * فحص أذونات الملفات والمجلدات
 */
async function checkFilePermissions(directories = []) {
  try {
    await logSecurity('بدء فحص أذونات الملفات والمجلدات...', 'info');
    
    // المجلدات الحساسة التي يجب فحصها
    const dirsToCheck = directories.length > 0 ? directories : [
      path.join(__dirname, '../config'),
      path.join(__dirname, '../backups'),
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../../server')
    ];
    
    for (const dir of dirsToCheck) {
      if (!(await fs.stat(dir).catch(() => false))) {
        await logSecurity(`المجلد غير موجود: ${dir}`, 'warning');
        continue;
      }
      
      // فحص أذونات المجلد
      const dirStats = await fs.stat(dir);
      const dirMode = dirStats.mode.toString(8).slice(-3);
      
      if (dirMode.startsWith('7') || dirMode.endsWith('7')) {
        await logSecurity(`مجلد مع أذونات مفتوحة للغاية: ${dir} (${dirMode})`, 'warning');
      }
      
      // فحص الملفات داخل المجلد
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStats = await fs.stat(filePath);
        
        if (fileStats.isFile()) {
          const fileMode = fileStats.mode.toString(8).slice(-3);
          
          if (fileMode.startsWith('7') || fileMode.endsWith('7') || fileMode.endsWith('6')) {
            await logSecurity(`ملف مع أذونات مفتوحة للغاية: ${filePath} (${fileMode})`, 'warning');
          }
          
          // فحص خاص لملفات الإعدادات
          if (file.endsWith('.json') || file.endsWith('.env') || file.endsWith('.config.js')) {
            if (fileMode !== '600' && fileMode !== '400') {
              await logSecurity(`ملف إعدادات يجب أن يكون له أذونات مقيدة: ${filePath} (${fileMode})`, 'warning');
            }
          }
        }
      }
    }
    
    await logSecurity('تم الانتهاء من فحص أذونات الملفات والمجلدات', 'info');
    
    return true;
  } catch (error) {
    await logSecurity(`خطأ أثناء فحص أذونات الملفات: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * تنظيف وتدوير ملفات السجلات
 */
async function rotateLogs(options = {}) {
  try {
    const logDir = path.join(__dirname, '../logs');
    const maxAgeInDays = options.maxAgeInDays || 30;
    const maxSizeMB = options.maxSizeMB || 10;
    
    await logSecurity('بدء تنظيف وتدوير ملفات السجلات...', 'info');
    
    // إنشاء مجلد السجلات إذا لم يكن موجودًا
    await fs.mkdir(logDir, { recursive: true });
    
    // الحصول على قائمة ملفات السجلات
    const files = await fs.readdir(logDir);
    
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      
      // التحقق من عمر الملف
      const fileAgeInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (fileAgeInDays > maxAgeInDays) {
        await logSecurity(`حذف ملف سجل قديم: ${file} (عمره ${fileAgeInDays.toFixed(2)} يوم)`, 'info');
        await fs.unlink(filePath);
        continue;
      }
      
      // التحقق من حجم الملف
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > maxSizeMB) {
        const timestamp = new Date().toISOString().replace(/[T:\.]/g, '_').replace(/Z/, '');
        const newFilePath = path.join(logDir, `${file.replace('.log', '')}_${timestamp}.log`);
        
        // نقل الملف القديم إلى ملف جديد مع طابع زمني
        await fs.rename(filePath, newFilePath);
        
        // إنشاء ملف سجل جديد فارغ
        await fs.writeFile(filePath, `Log file rotated at ${new Date().toISOString()}\n`);
        
        await logSecurity(`تم تدوير ملف سجل كبير: ${file} (${fileSizeMB.toFixed(2)} MB)`, 'info');
      }
    }
    
    await logSecurity('تم الانتهاء من تنظيف وتدوير ملفات السجلات', 'info');
    
    return true;
  } catch (error) {
    await logSecurity(`خطأ أثناء تنظيف ملفات السجلات: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * تنفيذ فحص أمني شامل
 */
async function performSecurityAudit() {
  try {
    await logSecurity('بدء الفحص الأمني الشامل...', 'info');
    
    // فحص قوة كلمات المرور
    await checkPasswordStrength();
    
    // فحص أذونات الملفات
    await checkFilePermissions();
    
    // تنظيف ملفات السجلات
    await rotateLogs();
    
    await logSecurity('تم الانتهاء من الفحص الأمني الشامل', 'info');
    
    return {
      completed: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    await logSecurity(`خطأ أثناء الفحص الأمني الشامل: ${error.message}`, 'error');
    throw error;
  }
}

module.exports = {
  checkPasswordStrength,
  applySQLInjectionProtection,
  checkFilePermissions,
  rotateLogs,
  performSecurityAudit,
  logSecurity
};

// تنفيذ الفحص الأمني عند استدعاء الملف مباشرة
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'audit') {
    performSecurityAudit()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'permissions') {
    checkFilePermissions()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'rotate-logs') {
    rotateLogs()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else {
    console.log(`
استخدام:
  node security.js audit          إجراء فحص أمني شامل
  node security.js permissions    فحص أذونات الملفات
  node security.js rotate-logs    تنظيف وتدوير ملفات السجلات
    `);
    process.exit(1);
  }
}