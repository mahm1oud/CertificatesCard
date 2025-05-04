#!/usr/bin/env node

/**
 * هذا السكربت يقوم بتحويل التطبيق من استخدام محاكاة Canvas إلى استخدام المكتبة الحقيقية node-canvas
 * يجب تشغيل هذا السكربت بعد تثبيت متطلبات مكتبة node-canvas على النظام
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// الألوان للطباعة في الطرفية
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

const rootDir = process.cwd();
const serverDir = path.join(rootDir, 'server');
const certificateGeneratorPath = path.join(serverDir, 'certificate-generator.ts');
const imageGeneratorPath = path.join(serverDir, 'optimized-image-generator.ts');

console.log(`${colors.cyan}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   🔄 تحويل التطبيق لاستخدام مكتبة Canvas الحقيقية    │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);

// تثبيت مكتبة node-canvas
function installCanvas() {
  console.log(`${colors.yellow}📦 جاري تثبيت مكتبة node-canvas...${colors.reset}`);
  
  try {
    execSync('npm install canvas --save', { stdio: 'inherit' });
    console.log(`${colors.green}✓ تم تثبيت مكتبة node-canvas بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء تثبيت مكتبة node-canvas: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}⚠️ تأكد من تثبيت متطلبات المكتبة أولاً باستخدام السكربت install-canvas-dependencies.sh${colors.reset}`);
    return false;
  }
}

// تعديل ملف certificate-generator.ts
function updateCertificateGenerator() {
  console.log(`${colors.yellow}🔄 جاري تعديل ملف certificate-generator.ts...${colors.reset}`);
  
  try {
    let content = fs.readFileSync(certificateGeneratorPath, 'utf-8');
    
    // استبدال استيراد المحاكاة بالمكتبة الحقيقية
    content = content.replace(
      "import { createCanvas, loadImage, registerFont } from './lib/canvas-mock';",
      "import { createCanvas, loadImage, registerFont } from 'canvas';"
    );
    
    // إزالة التعليقات حول المحاكاة والأخطاء المرتبطة بها
    content = content.replace(
      /\/\/ معالجة خاصة لبيئة Replit التي تستخدم محاكاة Canvas[\s\S]*?let buffer;[\s\S]*?try {[\s\S]*?buffer = canvas\.toBuffer\([^)]*\);[\s\S]*?} catch \(canvasError\) {[\s\S]*?console\.warn\([^)]*\);[\s\S]*?buffer = Buffer\.from\([^)]*\);[\s\S]*?console\.log\([^)]*\);[\s\S]*?}/,
      "const buffer = canvas.toBuffer('image/png');"
    );
    
    fs.writeFileSync(certificateGeneratorPath, content, 'utf-8');
    console.log(`${colors.green}✓ تم تعديل ملف certificate-generator.ts بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء تعديل ملف certificate-generator.ts: ${error.message}${colors.reset}`);
    return false;
  }
}

// تعديل ملف optimized-image-generator.ts
function updateImageGenerator() {
  console.log(`${colors.yellow}🔄 جاري تعديل ملف optimized-image-generator.ts...${colors.reset}`);
  
  try {
    let content = fs.readFileSync(imageGeneratorPath, 'utf-8');
    
    // استبدال محاكاة Canvas بالمكتبة الحقيقية إذا كان موجوداً
    if (content.includes("import { createCanvas, loadImage } from './lib/canvas-mock';")) {
      content = content.replace(
        "import { createCanvas, loadImage } from './lib/canvas-mock';",
        "import { createCanvas, loadImage } from 'canvas';"
      );
    }
    
    // إعادة تمكين استخدام WebP
    content = content.replace(
      /\/\/ تعطيل استخدام WebP مؤقتاً لمشكلة توافق في بيئة Replit[\s\S]*?\/\/ استخدام PNG للمعاينة بدلاً من ذلك[\s\S]*?if \(quality === 'preview' && format !== 'jpeg'\) {[\s\S]*?return await sharpImg\.png\({ quality: outputQuality }\)\.toBuffer\(\);[\s\S]*?}/,
      "// استخدام WebP للمعاينة لتسريع التحميل بدلا من PNG للواجهة\n  if (quality === 'preview' && format !== 'jpeg') {\n    return await sharpImg.webp({ quality: outputQuality }).toBuffer();\n  }"
    );
    
    fs.writeFileSync(imageGeneratorPath, content, 'utf-8');
    console.log(`${colors.green}✓ تم تعديل ملف optimized-image-generator.ts بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء تعديل ملف optimized-image-generator.ts: ${error.message}${colors.reset}`);
    return false;
  }
}

// حذف ملف المحاكاة لتجنب استخدامه
function removeCanvasMock() {
  console.log(`${colors.yellow}🗑️ جاري إنشاء نسخة احتياطية من ملف المحاكاة قبل حذفه...${colors.reset}`);
  
  const canvasMockPath = path.join(serverDir, 'lib', 'canvas-mock.ts');
  const canvasMockBackupPath = path.join(serverDir, 'lib', 'canvas-mock.ts.bak');
  
  try {
    if (fs.existsSync(canvasMockPath)) {
      // إنشاء نسخة احتياطية
      fs.copyFileSync(canvasMockPath, canvasMockBackupPath);
      console.log(`${colors.green}✓ تم إنشاء نسخة احتياطية من ملف المحاكاة في ${canvasMockBackupPath}${colors.reset}`);
      
      // تعديل الملف بدلًا من حذفه لتجنب أي مشاكل مع الاستيرادات
      const mockContent = `/**
 * ملف المحاكاة مُعطل - تم استبداله بالمكتبة الحقيقية canvas
 * 
 * هذا الملف موجود للتوافق مع الكود القديم ويقوم بإعادة تصدير المكتبة الحقيقية
 */

export { createCanvas, loadImage, registerFont } from 'canvas';
`;
      fs.writeFileSync(canvasMockPath, mockContent, 'utf-8');
      console.log(`${colors.green}✓ تم تعديل ملف المحاكاة ليستخدم المكتبة الحقيقية${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠️ ملف المحاكاة غير موجود: ${canvasMockPath}${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء التعامل مع ملف المحاكاة: ${error.message}${colors.reset}`);
    return false;
  }
}

// تشغيل الخطوات بالترتيب
async function main() {
  console.log(`${colors.yellow}🔍 جاري التحقق من متطلبات تحويل التطبيق...${colors.reset}`);
  
  const canvasInstalled = installCanvas();
  if (!canvasInstalled) {
    console.log(`${colors.red}✗ فشل تثبيت مكتبة node-canvas، يرجى تثبيت متطلبات المكتبة أولاً${colors.reset}`);
    console.log(`${colors.yellow}ℹ️ يمكنك تشغيل السكربت التالي لتثبيت المتطلبات:${colors.reset}`);
    console.log(`${colors.cyan}  sudo bash install/scripts/install-canvas-dependencies.sh${colors.reset}`);
    process.exit(1);
  }
  
  const certGenUpdated = updateCertificateGenerator();
  const imageGenUpdated = updateImageGenerator();
  const mockRemoved = removeCanvasMock();
  
  if (certGenUpdated && imageGenUpdated && mockRemoved) {
    console.log(`${colors.green}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   ✓ تم تحويل التطبيق لاستخدام مكتبة Canvas الحقيقية   │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   ✗ حدثت مشكلة أثناء تحويل التطبيق                     │
│   يرجى مراجعة الأخطاء أعلاه                          │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);
  }
}

// تشغيل البرنامج
main().catch(error => {
  console.error(`${colors.red}✗ حدث خطأ غير متوقع: ${error.message}${colors.reset}`);
  process.exit(1);
});