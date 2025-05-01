/**
 * وحدة لجمع معلومات النظام
 * توفر وظائف لجمع معلومات تفصيلية عن حالة الخادم والنظام
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { pool } from '../db';
import { getCacheStats } from './cache-manager';

const execPromise = util.promisify(exec);

/**
 * الحصول على معلومات الاستخدام المتقدمة للخادم
 */
export async function getServerInfo() {
  try {
    // معلومات النظام
    const systemInfo = {
      os: {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        hostname: os.hostname(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usedPercent: (1 - (os.freemem() / os.totalmem())) * 100,
      },
      cpus: os.cpus(),
      network: getNetworkInterfaces(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        env: getEnvironmentInfo(),
        version: process.version,
        argv: process.argv,
      },
      app: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      diskSpace: await getDiskSpace(),
      cache: getCacheStats(),
      database: await getDatabaseInfo(),
      directories: getDirectoriesInfo(),
    };

    return systemInfo;
  } catch (error) {
    console.error('Error gathering system information:', error);
    return { error: 'Error gathering system information', details: (error as Error).message };
  }
}

/**
 * الحصول على معلومات واجهات الشبكة
 */
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(interfaces)) {
    if (value) {
      result[key] = value.map(adapter => ({
        address: adapter.address,
        netmask: adapter.netmask,
        family: adapter.family,
        mac: adapter.mac,
        internal: adapter.internal,
        cidr: adapter.cidr,
      }));
    }
  }

  return result;
}

/**
 * الحصول على معلومات بيئة التشغيل
 */
function getEnvironmentInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    TZ: process.env.TZ,
    HOME: process.env.HOME,
    USER: process.env.USER,
    PATH: process.env.PATH?.split(':').slice(0, 5).join(':') + '...',
  };
}

/**
 * الحصول على معلومات مساحة القرص
 */
async function getDiskSpace() {
  try {
    if (os.platform() === 'win32') {
      const { stdout } = await execPromise('wmic logicaldisk get size,freespace,caption');
      return stdout;
    } else {
      const { stdout } = await execPromise('df -h / /tmp');
      return stdout;
    }
  } catch (error) {
    console.error('Error getting disk space info:', error);
    return 'Error getting disk space info';
  }
}

/**
 * الحصول على معلومات قاعدة البيانات
 */
async function getDatabaseInfo() {
  try {
    // التحقق من حالة الاتصال بقاعدة البيانات
    const client = await pool.connect();
    
    try {
      // إحصائيات قاعدة البيانات
      const dbSizeResult = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
      const pgVersion = await client.query('SELECT version() as version');
      const connInfo = await client.query(`SELECT COUNT(*) as connections FROM pg_stat_activity`);
      
      // عدد الجداول والعناصر
      const tableCountResult = await client.query(
        `SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public'`
      );
      
      const stats = {
        version: pgVersion.rows[0]?.version,
        size: dbSizeResult.rows[0]?.size,
        connections: connInfo.rows[0]?.connections,
        tables: tableCountResult.rows[0]?.tables,
        url: maskConnectionString(process.env.DATABASE_URL || ''),
        status: 'connected',
      };
      
      return stats;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting database info:', error);
    return { status: 'disconnected', error: (error as Error).message };
  }
}

/**
 * حجب معلومات الاتصال الحساسة
 */
function maskConnectionString(connectionString: string): string {
  if (!connectionString) return '';
  
  try {
    // محاولة تقسيم سلسلة الاتصال وحجب معلومات كلمة المرور
    if (connectionString.includes('@')) {
      // postgres://user:password@host:port/database
      return connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
    }
    
    // إذا كان التنسيق غير معروف، أعد ملخصًا فقط
    return connectionString.substring(0, 10) + '****';
  } catch (e) {
    // في حالة حدوث أي أخطاء، أعد رسالة مبهمة
    return '[connection string hidden]';
  }
}

/**
 * الحصول على معلومات المجلدات
 */
function getDirectoriesInfo() {
  const root = process.cwd();
  
  const directories = {
    root,
    uploads: {
      path: path.join(root, 'uploads'),
      exists: fs.existsSync(path.join(root, 'uploads')),
      files: 0,
      size: 0,
    },
    temp: {
      path: path.join(root, 'temp'),
      exists: fs.existsSync(path.join(root, 'temp')),
      files: 0,
      size: 0,
    },
    static: {
      path: path.join(root, 'client', 'static'),
      exists: fs.existsSync(path.join(root, 'client', 'static')),
      files: 0,
      size: 0,
    },
  };
  
  // حساب عدد الملفات وحجمها
  try {
    if (directories.uploads.exists) {
      const uploadFiles = fs.readdirSync(directories.uploads.path);
      directories.uploads.files = uploadFiles.length;
      
      // حساب الحجم مع تحديد حد أقصى لعدد الملفات التي يتم التحقق منها
      const maxFiles = 100; // لتجنب الثقل الزائد
      let size = 0;
      for (let i = 0; i < Math.min(uploadFiles.length, maxFiles); i++) {
        try {
          const filePath = path.join(directories.uploads.path, uploadFiles[i]);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            size += stats.size;
          }
        } catch (e) {
          // تجاهل أخطاء الملفات الفردية
        }
      }
      directories.uploads.size = size;
    }
    
    if (directories.temp.exists) {
      const tempFiles = fs.readdirSync(directories.temp.path);
      directories.temp.files = tempFiles.length;
    }
    
    if (directories.static.exists) {
      const staticFiles = fs.readdirSync(directories.static.path);
      directories.static.files = staticFiles.length;
    }
  } catch (error) {
    console.error('Error counting directory files:', error);
  }
  
  return directories;
}
