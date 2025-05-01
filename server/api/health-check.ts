/**
 * ملف التحقق من صحة النظام
 * يتضمن مسارات API للتحقق من حالة التطبيق وقاعدة البيانات
 */

import express from 'express';
import { performDatabaseHealthCheck, attemptDatabaseRecovery } from '../lib/database-health';
import { checkDatabaseConnection } from '../db';

const router = express.Router();

/**
 * مسار للتحقق من صحة النظام بشكل عام
 * يمكن استخدامه للتحقق من أن الخدمة تعمل
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'النظام يعمل بشكل جيد',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * مسار للتحقق من صحة قاعدة البيانات
 * يستخدم للتحقق من حالة الاتصال بقاعدة البيانات وإجراء إصلاحات تلقائية عند الحاجة
 */
router.get('/database', async (req, res) => {
  try {
    const healthStatus = await performDatabaseHealthCheck();
    
    // إرجاع حالة الصحة 200 OK إذا كان كل شيء على ما يرام، وإلا 503 Service Unavailable
    if (healthStatus.status === 'ok') {
      res.json(healthStatus);
    } else {
      res.status(503).json(healthStatus);
      
      // محاولة إصلاح المشكلة تلقائيًا في الخلفية
      setTimeout(async () => {
        await attemptDatabaseRecovery();
      }, 1000);
    }
  } catch (error) {
    console.error('Error checking database health:', error);
    res.status(500).json({
      status: 'error',
      message: `Error performing health check: ${(error as Error).message}`,
      timestamp: new Date()
    });
  }
});

/**
 * مسار لإعادة تشغيل اتصال قاعدة البيانات
 * يمكن استخدامه لإصلاح المشاكل يدويًا
 */
router.post('/database/restart', async (req, res) => {
  try {
    console.log('محاولة إعادة تشغيل اتصال قاعدة البيانات...');
    
    const success = await attemptDatabaseRecovery();
    
    if (success) {
      // التحقق من نجاح إعادة الاتصال
      const connected = await checkDatabaseConnection();
      
      if (connected) {
        res.json({
          status: 'ok',
          message: 'تم إعادة تشغيل اتصال قاعدة البيانات بنجاح',
          timestamp: new Date()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'فشلت إعادة تشغيل اتصال قاعدة البيانات',
          timestamp: new Date()
        });
      }
    } else {
      res.status(500).json({
        status: 'error',
        message: 'فشلت محاولة إعادة تشغيل اتصال قاعدة البيانات',
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error restarting database connection:', error);
    res.status(500).json({
      status: 'error',
      message: `Error restarting database connection: ${(error as Error).message}`,
      timestamp: new Date()
    });
  }
});

export default router;