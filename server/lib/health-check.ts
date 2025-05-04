/**
 * وحدة التحقق من صحة النظام
 * تستخدم للتحقق من صحة جميع مكونات النظام وتوفر واجهة RESTful للتحقق من الحالة
 */

import { Router, Request, Response } from 'express';
import { db, pool } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import os from 'os';

// إنشاء موجه خاص بفحص الصحة
const healthRouter = Router();

/**
 * معلومات النظام
 */
interface SystemInfo {
  hostname: string;
  platform: string;
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercentage: number;
  };
  cpu: {
    cores: number;
    model: string;
  };
}

/**
 * معلومات المجلدات
 */
interface DirectoriesInfo {
  uploads: {
    exists: boolean;
    writable: boolean;
    size?: number;
  };
  temp: {
    exists: boolean;
    writable: boolean;
    size?: number;
  };
  fonts: {
    exists: boolean;
    writable: boolean;
    size?: number;
  };
}

/**
 * حالة قاعدة البيانات
 */
interface DatabaseStatus {
  connected: boolean;
  poolSize: number;
  idleConnections: number;
  waitingConnections: number;
  errorMessage?: string;
}

/**
 * فحص صحة النظام
 * @returns حالة النظام
 */
async function checkSystemHealth() {
  // فحص حالة قاعدة البيانات
  let dbStatus: DatabaseStatus;
  try {
    // اختبار الاتصال بقاعدة البيانات
    const result = await db.execute(sql`SELECT 1 as test`);
    
    // إحصائيات المجمع - استخدام قيم افتراضية
    const poolInfo = {
      size: 5,  // قيمة افتراضية
      idle: 0,  // قيمة افتراضية
      waiting: 0  // قيمة افتراضية
    };
    
    dbStatus = {
      connected: true,
      poolSize: poolInfo.size,
      idleConnections: poolInfo.idle,
      waitingConnections: poolInfo.waiting
    };
  } catch (error) {
    dbStatus = {
      connected: false,
      poolSize: 0,
      idleConnections: 0,
      waitingConnections: 0,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }

  // فحص حالة المجلدات
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  const tempDir = path.resolve(process.cwd(), 'temp');
  const fontsDir = path.resolve(process.cwd(), 'fonts');

  const directoriesInfo: DirectoriesInfo = {
    uploads: await checkDirectory(uploadDir),
    temp: await checkDirectory(tempDir),
    fonts: await checkDirectory(fontsDir)
  };

  // الحصول على معلومات النظام
  const systemInfo: SystemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usedPercentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'غير معروف'
    }
  };

  return {
    status: dbStatus.connected && 
            directoriesInfo.uploads.exists && 
            directoriesInfo.temp.exists && 
            directoriesInfo.fonts.exists ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    directories: directoriesInfo,
    system: systemInfo
  };
}

/**
 * فحص حالة مجلد
 * @param dirPath مسار المجلد
 * @returns معلومات حالة المجلد
 */
async function checkDirectory(dirPath: string) {
  const dirStatus = {
    exists: false,
    writable: false,
    size: 0
  };

  try {
    // التحقق من وجود المجلد
    const stats = await fs.promises.stat(dirPath).catch(() => null);
    dirStatus.exists = stats !== null && stats.isDirectory();

    // التحقق من إمكانية الكتابة
    if (dirStatus.exists) {
      try {
        const testFile = path.join(dirPath, `.health-check-${Date.now()}.tmp`);
        await fs.promises.writeFile(testFile, 'test');
        await fs.promises.unlink(testFile);
        dirStatus.writable = true;
      } catch (error) {
        dirStatus.writable = false;
      }

      // حساب حجم المجلد
      dirStatus.size = await calculateDirectorySize(dirPath);
    }
  } catch (error) {
    console.error(`خطأ في فحص المجلد ${dirPath}:`, error);
  }

  return dirStatus;
}

/**
 * حساب حجم مجلد
 * @param dirPath مسار المجلد
 * @returns حجم المجلد بالبايت
 */
async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const files = await fs.promises.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        totalSize += await calculateDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`خطأ في حساب حجم المجلد ${dirPath}:`, error);
  }

  return totalSize;
}

// نقطة النهاية الرئيسية للتحقق من الصحة
healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const healthStatus = await checkSystemHealth();
    
    // تحديد كود الاستجابة بناءً على الحالة
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('خطأ في فحص صحة النظام:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// نسخة مبسطة من فحص الصحة (للمراقبة)
healthRouter.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// إضافة تفاصيل أكثر للمسؤولين
healthRouter.get('/details', async (req: Request, res: Response) => {
  // التحقق من أن المستخدم مصادق عليه
  if (!req.isAuthenticated() || !req.user) {
    return res.status(403).json({
      status: 'error',
      message: 'غير مصرح بالوصول'
    });
  }
  
  // يمكن للمستخدمين المصادق عليهم الوصول للتفاصيل (يمكن تعديل هذا لاحقًا للتحقق من دور المستخدم)

  try {
    const healthStatus = await checkSystemHealth();
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('خطأ في فحص صحة النظام التفصيلي:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export { healthRouter };