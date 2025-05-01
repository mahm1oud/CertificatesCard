import express, { Request, Response } from 'express';
import { isAdmin } from '../auth';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import { getServerInfo } from '../lib/system-info';
import { clearCachedData } from '../lib/cache-manager';

const router = express.Router();
const execPromise = util.promisify(exec);

/**
 * مسار لمسح ذاكرة التخزين المؤقت
 * يمسح كل البيانات المؤقتة المخزنة في الذاكرة
 */
router.post('/clear-cache', isAdmin, async (req: Request, res: Response) => {
  try {
    // استدعاء دالة مسح الذاكرة المؤقتة
    await clearCachedData();
    
    console.log('✅ تم مسح ذاكرة التخزين المؤقت بنجاح');
    res.json({ success: true, message: 'تم مسح ذاكرة التخزين المؤقت بنجاح' });
  } catch (error) {
    console.error('❌ خطأ أثناء مسح ذاكرة التخزين المؤقت:', error);
    res.status(500).json({ success: false, message: 'فشل مسح ذاكرة التخزين المؤقت', error: (error as Error).message });
  }
});

/**
 * مسار لتنظيف الملفات المرفوعة غير المستخدمة
 * يحذف الملفات المؤقتة والملفات غير المستخدمة
 */
router.post('/purge-uploads', isAdmin, async (req: Request, res: Response) => {
  try {
    // مجلدات التنظيف
    const foldersToClean = [
      path.join(process.cwd(), 'uploads', 'temp'),
      path.join(process.cwd(), 'temp')
    ];
    
    // عدد الملفات التي تم حذفها
    let deletedCount = 0;
    
    // تنظيف المجلدات
    for (const folder of foldersToClean) {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder);
        
        // حذف كل الملفات المؤقتة
        for (const file of files) {
          const filePath = path.join(folder, file);
          const fileStat = fs.statSync(filePath);
          
          // تخطي المجلدات
          if (fileStat.isDirectory()) continue;
          
          // حذف الملفات التي مر على إنشائها أكثر من ساعتين
          const fileAgeHours = (Date.now() - fileStat.mtimeMs) / (1000 * 60 * 60);
          if (fileAgeHours > 2) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
    }
    
    console.log(`✅ تم تنظيف ${deletedCount} ملف من المجلدات المؤقتة`);
    res.json({ success: true, message: `تم تنظيف ${deletedCount} ملف من المجلدات المؤقتة` });
  } catch (error) {
    console.error('❌ خطأ أثناء تنظيف الملفات المرفوعة:', error);
    res.status(500).json({ success: false, message: 'فشل تنظيف الملفات المرفوعة', error: (error as Error).message });
  }
});

/**
 * مسار لإعادة تشغيل الخادم
 * يمكن من إعادة تشغيل عملية النود جي اس
 */
router.post('/restart-server', isAdmin, async (req: Request, res: Response) => {
  try {
    // إرسال استجابة قبل إعادة التشغيل
    res.json({ success: true, message: 'جاري إعادة تشغيل الخادم، قد يستغرق الأمر بضع ثواني...' });
    
    console.log('🔄 جاري إعادة تشغيل الخادم...');
    
    // إعادة تشغيل بعد ثانية واحدة لضمان وصول الاستجابة
    setTimeout(() => {
      process.exit(0); // سوف يقوم نظام ريبليت بإعادة تشغيل العملية تلقائيًا
    }, 1000);
  } catch (error) {
    console.error('❌ خطأ أثناء محاولة إعادة تشغيل الخادم:', error);
    res.status(500).json({ success: false, message: 'فشل إعادة تشغيل الخادم', error: (error as Error).message });
  }
});

/**
 * مسار للحصول على معلومات النظام
 * يقدم معلومات تفصيلية عن حالة النظام والخادم
 */
router.get('/system-info', isAdmin, async (req: Request, res: Response) => {
  try {
    // جلب معلومات النظام
    const systemInfo = await getServerInfo();
    
    res.json({ success: true, data: systemInfo });
  } catch (error) {
    console.error('❌ خطأ أثناء جلب معلومات النظام:', error);
    res.status(500).json({ success: false, message: 'فشل جلب معلومات النظام', error: (error as Error).message });
  }
});

export default router;