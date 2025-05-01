import express, { Request, Response } from 'express';
import { isAdmin } from '../auth';
import { storage } from '../storage';

const router = express.Router();

// Get display settings
router.get('/display', isAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getSettings('display');
    return res.json({ settings: settings || {
      displayMode: 'multi',
      templateViewMode: 'multi-page', // 'multi-page' للطريقة التقليدية، 'single-page' للطريقة الجديدة
      enableSocialFormats: true,
      defaultSocialFormat: 'instagram'
    }});
  } catch (error) {
    console.error('Error fetching display settings:', error);
    return res.status(500).json({ message: 'Error fetching display settings', error: (error as Error).message });
  }
});

// Update display settings
router.post('/display', isAdmin, async (req: Request, res: Response) => {
  try {
    // نسخة القيم من الطلب يسهل التعامل معها
    const data = req.body;
    
    // نتأكد من أن القيم مستخرجة بشكل صحيح، حتى لو كانت متداخلة
    const displayMode = data.displayMode && typeof data.displayMode === 'object' && 'value' in data.displayMode 
        ? data.displayMode.value 
        : data.displayMode || 'multi';
    
    const templateViewMode = data.templateViewMode && typeof data.templateViewMode === 'object' && 'value' in data.templateViewMode 
        ? data.templateViewMode.value 
        : data.templateViewMode || 'multi-page';
    
    const enableSocialFormats = data.enableSocialFormats && typeof data.enableSocialFormats === 'object' && 'value' in data.enableSocialFormats
        ? data.enableSocialFormats.value 
        : data.enableSocialFormats !== undefined ? data.enableSocialFormats : true;
    
    const defaultSocialFormat = data.defaultSocialFormat && typeof data.defaultSocialFormat === 'object' && 'value' in data.defaultSocialFormat
        ? data.defaultSocialFormat.value 
        : data.defaultSocialFormat || '';
    
    console.log('Updating display settings with:', {
      displayMode, templateViewMode, enableSocialFormats, defaultSocialFormat
    });
    
    // تحديث كل إعداد بشكل منفصل
    await storage.updateSettingValue('display', 'displayMode', displayMode);
    await storage.updateSettingValue('display', 'templateViewMode', templateViewMode);
    await storage.updateSettingValue('display', 'enableSocialFormats', enableSocialFormats);
    await storage.updateSettingValue('display', 'defaultSocialFormat', defaultSocialFormat);
    
    // إرجاع الإعدادات المحدثة
    const settings = {
      displayMode: displayMode,
      templateViewMode: templateViewMode,
      enableSocialFormats: enableSocialFormats,
      defaultSocialFormat: defaultSocialFormat
    };
    
    return res.json({ success: true, settings }); // تأكد من استخدام return لإنهاء دالة الاستجابة
  } catch (error) {
    console.error('Error updating display settings:', error);
    return res.status(500).json({ message: 'Error updating display settings', error: (error as Error).message });
  }
});

// Get social media formats
router.get('/social-formats', async (req: Request, res: Response) => {
  try {
    // Import the social image generator module
    const { DEFAULT_SOCIAL_FORMATS } = await import('../lib/social-image-generator');
    
    // Use the DEFAULT_SOCIAL_FORMATS from the module as a fallback
    let formats = DEFAULT_SOCIAL_FORMATS;
    
    try {
      // Try to get formats from database
      const settingsArray = await storage.getSettingsByCategory('social-formats');
      
      // If formats exist in the database, use them
      if (settingsArray && settingsArray.length > 0) {
        formats = {};
        
        for (const setting of settingsArray) {
          try {
            if (setting.key && setting.value) {
              formats[setting.key] = JSON.parse(String(setting.value));
            }
          } catch (parseError) {
            console.error(`Error parsing format setting for ${setting.key}:`, parseError);
          }
        }
      }
    } catch (dbError) {
      console.error('Error fetching social formats from database:', dbError);
    }
    
    return res.json({ formats });
  } catch (error) {
    console.error('Error fetching social formats:', error);
    return res.status(500).json({ message: 'Error fetching social formats', error: (error as Error).message });
  }
});

// Update social media formats
router.post('/social-formats', isAdmin, async (req: Request, res: Response) => {
  try {
    const { formats } = req.body;
    
    if (!formats || typeof formats !== 'object') {
      return res.status(400).json({ message: 'Invalid format data' });
    }
    
    // Update each format in the database
    const results = [];
    
    for (const [key, value] of Object.entries(formats)) {
      const stringValue = JSON.stringify(value);
      const result = await storage.updateSetting('social-formats', key, stringValue);
      results.push(result);
    }
    
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Error updating social formats:', error);
    return res.status(500).json({ message: 'Error updating social formats', error: (error as Error).message });
  }
});

export default router;