/**
 * نظام النسخ الاحتياطي التلقائي - يقوم بحفظ نسخة من قاعدة البيانات بشكل دوري
 * 
 * هذا الملف يوفر الوظائف التالية:
 * 1. النسخ الاحتياطي الكامل لقاعدة البيانات
 * 2. حفظ النسخ الاحتياطية بتنسيق مضغوط
 * 3. جدولة عمليات النسخ الاحتياطي
 * 4. الاحتفاظ بسجل للنسخ الاحتياطية
 * 5. تنظيف النسخ الاحتياطية القديمة
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const zlib = require('zlib');
const mysql = require('mysql2/promise');
const cron = require('node-cron');

// الإعدادات الافتراضية
const DEFAULT_CONFIG = {
  backupDir: path.join(__dirname, '../backups'),
  logFile: path.join(__dirname, '../logs/backup.log'),
  schedule: '0 0 * * *', // يومياً عند الساعة 12:00 صباحًا
  maxBackups: 7, // الاحتفاظ بآخر 7 نسخ احتياطية فقط
  compressBackups: true
};

// قراءة ملف الإعدادات
const CONFIG_FILE = path.join(__dirname, '../config/config.json');

/**
 * كتابة سجل
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  if (!fs.existsSync(path.dirname(DEFAULT_CONFIG.logFile))) {
    fs.mkdirSync(path.dirname(DEFAULT_CONFIG.logFile), { recursive: true });
  }
  
  fs.appendFileSync(DEFAULT_CONFIG.logFile, logMessage);
}

/**
 * إنشاء نسخة احتياطية
 */
async function createBackup(config = {}) {
  // دمج الإعدادات المخصصة مع الإعدادات الافتراضية
  const options = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // التأكد من وجود مجلد النسخ الاحتياطية
    if (!fs.existsSync(options.backupDir)) {
      fs.mkdirSync(options.backupDir, { recursive: true });
    }
    
    // قراءة ملف إعدادات التطبيق
    const appConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const { host, user, password, database } = appConfig.database;
    
    // إنشاء اسم ملف النسخة الاحتياطية
    const date = new Date();
    const timestamp = date.toISOString().replace(/[T:\.]/g, '_').replace(/Z/, '');
    const backupFilename = `backup_${database}_${timestamp}.sql`;
    const backupPath = path.join(options.backupDir, backupFilename);
    
    log(`🔍 بدء عملية النسخ الاحتياطي لقاعدة البيانات ${database}...`);
    
    // تنفيذ أمر mysqldump
    const cmd = `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} > "${backupPath}"`;
    await execAsync(cmd);
    
    let finalBackupPath = backupPath;
    
    // ضغط ملف النسخة الاحتياطية إذا كان مطلوبًا
    if (options.compressBackups) {
      const gzipFilePath = `${backupPath}.gz`;
      
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(backupPath);
        const writeStream = fs.createWriteStream(gzipFilePath);
        const gzip = zlib.createGzip();
        
        readStream.pipe(gzip).pipe(writeStream);
        
        writeStream.on('finish', () => {
          fs.unlinkSync(backupPath); // حذف الملف الأصلي غير المضغوط
          finalBackupPath = gzipFilePath;
          resolve();
        });
        
        writeStream.on('error', reject);
      });
    }
    
    const stats = fs.statSync(finalBackupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`✅ تم إنشاء نسخة احتياطية بنجاح: ${finalBackupPath} (${sizeMB} MB)`);
    
    // تنظيف النسخ الاحتياطية القديمة
    await cleanupOldBackups(options);
    
    return {
      path: finalBackupPath,
      size: stats.size,
      timestamp: date.toISOString()
    };
  } catch (error) {
    log(`❌ خطأ أثناء إنشاء نسخة احتياطية: ${error.message}`);
    throw error;
  }
}

/**
 * تنظيف النسخ الاحتياطية القديمة
 */
async function cleanupOldBackups(options) {
  try {
    // الحصول على قائمة ملفات النسخ الاحتياطية
    const files = fs.readdirSync(options.backupDir)
      .filter(file => file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
      .map(file => ({
        name: file,
        path: path.join(options.backupDir, file),
        time: fs.statSync(path.join(options.backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // ترتيب تنازلي حسب التاريخ
    
    // إذا كان عدد الملفات أكبر من الحد الأقصى، قم بحذف الملفات القديمة
    if (files.length > options.maxBackups) {
      const filesToDelete = files.slice(options.maxBackups);
      
      log(`🧹 تنظيف ${filesToDelete.length} نسخة احتياطية قديمة...`);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        log(`🗑️ تم حذف النسخة الاحتياطية القديمة: ${file.name}`);
      }
    }
  } catch (error) {
    log(`⚠️ خطأ أثناء تنظيف النسخ الاحتياطية القديمة: ${error.message}`);
    // لا نريد أن نفشل العملية الرئيسية إذا فشل التنظيف
  }
}

/**
 * استعادة نسخة احتياطية
 */
async function restoreBackup(backupPath, config = {}) {
  // دمج الإعدادات المخصصة مع الإعدادات الافتراضية
  const options = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // التحقق من وجود ملف النسخة الاحتياطية
    if (!fs.existsSync(backupPath)) {
      throw new Error(`ملف النسخة الاحتياطية غير موجود: ${backupPath}`);
    }
    
    // قراءة ملف إعدادات التطبيق
    const appConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const { host, user, password, database } = appConfig.database;
    
    log(`🔄 بدء استعادة النسخة الاحتياطية من: ${backupPath}...`);
    
    let sqlFilePath = backupPath;
    
    // فك ضغط الملف إذا كان مضغوطًا
    if (backupPath.endsWith('.gz')) {
      const unzippedPath = backupPath.replace('.gz', '');
      
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(backupPath);
        const writeStream = fs.createWriteStream(unzippedPath);
        const gunzip = zlib.createGunzip();
        
        readStream.pipe(gunzip).pipe(writeStream);
        
        writeStream.on('finish', () => {
          sqlFilePath = unzippedPath;
          resolve();
        });
        
        writeStream.on('error', reject);
      });
    }
    
    // تنفيذ أمر استعادة قاعدة البيانات
    const cmd = `mysql -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} < "${sqlFilePath}"`;
    await execAsync(cmd);
    
    // حذف الملف المؤقت غير المضغوط
    if (backupPath.endsWith('.gz') && sqlFilePath !== backupPath) {
      fs.unlinkSync(sqlFilePath);
    }
    
    log(`✅ تم استعادة النسخة الاحتياطية بنجاح!`);
    
    return true;
  } catch (error) {
    log(`❌ خطأ أثناء استعادة النسخة الاحتياطية: ${error.message}`);
    throw error;
  }
}

/**
 * بدء جدولة النسخ الاحتياطي التلقائي
 */
function startScheduledBackups(config = {}) {
  // دمج الإعدادات المخصصة مع الإعدادات الافتراضية
  const options = { ...DEFAULT_CONFIG, ...config };
  
  if (!cron.validate(options.schedule)) {
    log(`⚠️ جدول النسخ الاحتياطي غير صالح: ${options.schedule}`);
    return false;
  }
  
  log(`🕒 تم جدولة النسخ الاحتياطي التلقائي: ${options.schedule}`);
  
  // إنشاء مهمة cron
  const job = cron.schedule(options.schedule, async () => {
    try {
      log(`⏰ بدء النسخ الاحتياطي المجدول...`);
      await createBackup(options);
    } catch (error) {
      log(`❌ فشل النسخ الاحتياطي المجدول: ${error.message}`);
    }
  });
  
  return job;
}

/**
 * الحصول على قائمة النسخ الاحتياطية المتاحة
 */
function listBackups(config = {}) {
  // دمج الإعدادات المخصصة مع الإعدادات الافتراضية
  const options = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // التأكد من وجود مجلد النسخ الاحتياطية
    if (!fs.existsSync(options.backupDir)) {
      return [];
    }
    
    // الحصول على قائمة ملفات النسخ الاحتياطية
    const files = fs.readdirSync(options.backupDir)
      .filter(file => file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
      .map(file => {
        const stats = fs.statSync(path.join(options.backupDir, file));
        return {
          name: file,
          path: path.join(options.backupDir, file),
          size: stats.size,
          date: stats.mtime.toISOString(),
          compressed: file.endsWith('.gz')
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // ترتيب تنازلي حسب التاريخ
    
    return files;
  } catch (error) {
    log(`❌ خطأ أثناء قراءة قائمة النسخ الاحتياطية: ${error.message}`);
    return [];
  }
}

// تصدير الدوال
module.exports = {
  createBackup,
  restoreBackup,
  cleanupOldBackups,
  startScheduledBackups,
  listBackups
};

// تشغيل النسخ الاحتياطي عند استدعاء الملف مباشرة
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'backup') {
    createBackup()
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'restore' && args[1]) {
    restoreBackup(args[1])
      .then(() => process.exit(0))
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  } else if (command === 'list') {
    const backups = listBackups();
    console.log(`النسخ الاحتياطية المتاحة (${backups.length}):`);
    
    backups.forEach((backup, index) => {
      const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
      console.log(`${index + 1}. ${backup.name} (${sizeMB} MB) - ${new Date(backup.date).toLocaleString()}`);
    });
    
    process.exit(0);
  } else {
    console.log(`
استخدام:
  node backup.js backup     إنشاء نسخة احتياطية جديدة
  node backup.js restore <path>    استعادة نسخة احتياطية
  node backup.js list      عرض قائمة النسخ الاحتياطية المتاحة
    `);
    process.exit(1);
  }
}