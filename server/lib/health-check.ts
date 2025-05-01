/**
 * وحدة فحص صحة النظام
 * توفر هذه الوحدة وظائف للتحقق من صحة مكونات النظام المختلفة
 */

import { Request, Response, Router } from 'express';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

// واجهة نتيجة الفحص
interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  details: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
      error?: string;
    };
  };
}

/**
 * فحص صحة قاعدة البيانات
 * @returns نتيجة فحص قاعدة البيانات
 */
async function checkDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    return {
      status: 'ok' as const,
      message: `Connected successfully. Server time: ${result.rows[0].now}`
    };
  } catch (error: any) {
    return {
      status: 'error' as const,
      error: error.message
    };
  }
}

/**
 * فحص صحة نظام الملفات
 * @returns نتيجة فحص نظام الملفات
 */
async function checkFileSystem() {
  try {
    const dirs = ['uploads', 'temp', 'fonts'];
    const results = {};
    
    for (const dir of dirs) {
      const dirPath = path.resolve(process.cwd(), '..', dir);
      try {
        await fs.promises.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);
        results[dir] = { status: 'ok', message: 'Directory is accessible' };
      } catch (error: any) {
        results[dir] = { 
          status: 'error', 
          error: `Directory '${dir}' is not accessible: ${error.message}` 
        };
      }
    }
    
    return {
      status: Object.values(results).some(r => r.status === 'error') ? 'error' : 'ok',
      details: results
    };
  } catch (error: any) {
    return {
      status: 'error' as const,
      error: error.message
    };
  }
}

/**
 * فحص صحة النظام بالكامل
 * @returns نتيجة فحص النظام بالكامل
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const dbCheck = await checkDatabase();
  const fsCheck = await checkFileSystem();
  
  const systemStatus = dbCheck.status === 'ok' && fsCheck.status === 'ok' ? 'ok' : 'error';
  
  return {
    status: systemStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    details: {
      database: dbCheck,
      fileSystem: fsCheck
    }
  };
}

/**
 * إنشاء مسار Express لفحص صحة النظام
 * @returns مسار Express
 */
export function createHealthCheckRouter(): Router {
  const router = Router();
  
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const healthCheck = await performHealthCheck();
      
      res.status(healthCheck.status === 'ok' ? 200 : 500).json(healthCheck);
      
      // تسجيل الفحص
      if (healthCheck.status === 'ok') {
        logger.info('Health check passed', { result: healthCheck });
      } else {
        logger.warn('Health check failed', { result: healthCheck });
      }
    } catch (error: any) {
      logger.error('Health check error', error);
      
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  return router;
}

export default createHealthCheckRouter;