#!/usr/bin/env node

/**
 * سكربت التثبيت الرئيسي للتطبيق
 * يقوم هذا السكربت بتهيئة البيئة وتثبيت التطبيق على خادم الاستضافة
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// تهيئة واجهة التفاعل مع المستخدم
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// المسارات المهمة
const rootDir = process.cwd();
const configDir = path.join(rootDir, 'install', 'config');
const envTemplatePath = path.join(configDir, 'env.template');
const mysqlSchemaPath = path.join(rootDir, 'install', 'mysql', 'schema.sql');
const mysqlSeedPath = path.join(rootDir, 'install', 'mysql', 'seed.sql');

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

// طباعة رسالة ترحيبية
function printWelcome() {
  console.log(`${colors.cyan}${colors.bright}
  ╭──────────────────────────────────────────────────────╮
  │                                                      │
  │   🌟 مرحبًا بك في برنامج تثبيت تطبيق الشهادات! 🌟    │
  │                                                      │
  │   هذا البرنامج سيساعدك على تثبيت وإعداد التطبيق     │
  │   على خادم الاستضافة الخاص بك.                      │
  │                                                      │
  ╰──────────────────────────────────────────────────────╯
  ${colors.reset}`);
  
  // طباعة معلومات حول متطلبات Canvas
  console.log(`${colors.yellow}${colors.bright}
  ╭──────────────────────────────────────────────────────╮
  │                                                      │
  │   ⚠️ ملاحظة هامة حول مكتبة Canvas:                   │
  │                                                      │
  │   لتمكين توليد الصور بجودة عالية، ستحتاج إلى تثبيت  │
  │   مكتبات النظام اللازمة ومكتبة Canvas الحقيقية      │
  │   بعد إكمال عملية التثبيت، قم بتشغيل:               │
  │   sudo bash install/scripts/install-canvas-dependencies.sh │
  │   node install/scripts/switch-to-real-canvas.js      │
  │                                                      │
  │   لمزيد من المعلومات: docs/canvas-setup.md           │
  │                                                      │
  ╰──────────────────────────────────────────────────────╯
  ${colors.reset}`);
}

// التحقق من المتطلبات
async function checkRequirements() {
  console.log(`${colors.yellow}🔍 جاري التحقق من المتطلبات الأساسية...${colors.reset}`);
  
  // التحقق من وجود Node.js ونسخته
  try {
    const nodeVersion = execSync('node -v').toString().trim();
    console.log(`${colors.green}✓ Node.js موجود (${nodeVersion})${colors.reset}`);
    
    // التحقق من النسخة (يجب أن تكون 14 أو أعلى)
    const version = nodeVersion.replace('v', '').split('.')[0];
    if (parseInt(version) < 14) {
      console.log(`${colors.red}✗ نسخة Node.js يجب أن تكون 14 أو أعلى${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Node.js غير مثبت أو غير موجود في مسار النظام${colors.reset}`);
    return false;
  }
  
  // التحقق من وجود npm
  try {
    const npmVersion = execSync('npm -v').toString().trim();
    console.log(`${colors.green}✓ npm موجود (${npmVersion})${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ npm غير مثبت أو غير موجود في مسار النظام${colors.reset}`);
    return false;
  }
  
  // التحقق من وجود MySQL
  try {
    execSync('mysql --version');
    console.log(`${colors.green}✓ MySQL/MariaDB موجود${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ MySQL/MariaDB غير مثبت محليًا أو غير موجود في مسار النظام${colors.reset}`);
    console.log(`${colors.yellow}  سيتم استخدام معلومات الاتصال بقاعدة البيانات من ملف .env${colors.reset}`);
  }
  
  // التحقق من وجود الملفات المطلوبة
  if (!fs.existsSync(envTemplatePath)) {
    console.log(`${colors.red}✗ ملف قالب البيئة غير موجود: ${envTemplatePath}${colors.reset}`);
    return false;
  }
  
  if (!fs.existsSync(mysqlSchemaPath)) {
    console.log(`${colors.red}✗ ملف هيكل قاعدة البيانات غير موجود: ${mysqlSchemaPath}${colors.reset}`);
    return false;
  }
  
  if (!fs.existsSync(mysqlSeedPath)) {
    console.log(`${colors.red}✗ ملف البيانات الأولية غير موجود: ${mysqlSeedPath}${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ جميع المتطلبات متوفرة${colors.reset}`);
  return true;
}

// جمع معلومات قاعدة البيانات من المستخدم
async function collectDatabaseInfo() {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   📊 إعداد قاعدة البيانات MySQL                      │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);
    
    const dbInfo = {
      host: 'localhost',
      port: '3306',
      name: '',
      user: '',
      password: ''
    };
    
    rl.question(`${colors.yellow}الخادم (${colors.bright}localhost${colors.reset}${colors.yellow}): ${colors.reset}`, (host) => {
      dbInfo.host = host || dbInfo.host;
      
      rl.question(`${colors.yellow}المنفذ (${colors.bright}3306${colors.reset}${colors.yellow}): ${colors.reset}`, (port) => {
        dbInfo.port = port || dbInfo.port;
        
        rl.question(`${colors.yellow}اسم قاعدة البيانات: ${colors.reset}`, (name) => {
          if (!name) {
            console.log(`${colors.red}✗ يجب تحديد اسم قاعدة البيانات${colors.reset}`);
            return collectDatabaseInfo().then(resolve);
          }
          dbInfo.name = name;
          
          rl.question(`${colors.yellow}اسم المستخدم: ${colors.reset}`, (user) => {
            if (!user) {
              console.log(`${colors.red}✗ يجب تحديد اسم مستخدم قاعدة البيانات${colors.reset}`);
              return collectDatabaseInfo().then(resolve);
            }
            dbInfo.user = user;
            
            // استخدام getpass() لإخفاء كلمة المرور لكن هذا يتطلب مكتبة إضافية
            // هنا نستخدم readline مع تنبيه المستخدم أن كلمة المرور ستظهر
            console.log(`${colors.yellow}(تنبيه: كلمة المرور ستظهر على الشاشة)${colors.reset}`);
            rl.question(`${colors.yellow}كلمة المرور: ${colors.reset}`, (password) => {
              dbInfo.password = password;
              resolve(dbInfo);
            });
          });
        });
      });
    });
  });
}

// جمع معلومات التطبيق من المستخدم
async function collectAppInfo() {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   🔧 إعداد التطبيق                                   │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);
    
    const appInfo = {
      url: 'https://mycerts.example.com',
      port: '3000',
      sessionSecret: generateRandomString(32),
      cookieSecret: generateRandomString(32)
    };
    
    rl.question(`${colors.yellow}عنوان URL للتطبيق (${colors.bright}${appInfo.url}${colors.reset}${colors.yellow}): ${colors.reset}`, (url) => {
      appInfo.url = url || appInfo.url;
      
      rl.question(`${colors.yellow}المنفذ (${colors.bright}${appInfo.port}${colors.reset}${colors.yellow}): ${colors.reset}`, (port) => {
        appInfo.port = port || appInfo.port;
        
        console.log(`${colors.green}✓ تم إنشاء مفتاح سري للجلسات: ${colors.dim}${appInfo.sessionSecret}${colors.reset}`);
        console.log(`${colors.green}✓ تم إنشاء مفتاح سري للكوكيز: ${colors.dim}${appInfo.cookieSecret}${colors.reset}`);
        
        resolve(appInfo);
      });
    });
  });
}

// إنشاء ملف .env
function createEnvFile(dbInfo, appInfo) {
  console.log(`${colors.yellow}🔧 جاري إنشاء ملف .env...${colors.reset}`);
  
  try {
    let envContent = fs.readFileSync(envTemplatePath, 'utf-8');
    
    // استبدال القيم
    envContent = envContent
      .replace(/DB_HOST=.*$/m, `DB_HOST=${dbInfo.host}`)
      .replace(/DB_PORT=.*$/m, `DB_PORT=${dbInfo.port}`)
      .replace(/DB_USER=.*$/m, `DB_USER=${dbInfo.user}`)
      .replace(/DB_PASSWORD=.*$/m, `DB_PASSWORD=${dbInfo.password}`)
      .replace(/DB_NAME=.*$/m, `DB_NAME=${dbInfo.name}`)
      .replace(/DB_URL=.*$/m, `DB_URL=mysql://${dbInfo.user}:${dbInfo.password}@${dbInfo.host}:${dbInfo.port}/${dbInfo.name}`)
      .replace(/PORT=.*$/m, `PORT=${appInfo.port}`)
      .replace(/SESSION_SECRET=.*$/m, `SESSION_SECRET=${appInfo.sessionSecret}`)
      .replace(/COOKIE_SECRET=.*$/m, `COOKIE_SECRET=${appInfo.cookieSecret}`)
      .replace(/APP_URL=.*$/m, `APP_URL=${appInfo.url}`)
      .replace(/API_URL=.*$/m, `API_URL=${appInfo.url}/api`);
    
    // كتابة الملف
    fs.writeFileSync(path.join(rootDir, '.env'), envContent, 'utf-8');
    console.log(`${colors.green}✓ تم إنشاء ملف .env بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء إنشاء ملف .env: ${error.message}${colors.reset}`);
    return false;
  }
}

// تثبيت الاعتماديات (حزم npm)
function installDependencies() {
  console.log(`${colors.yellow}📦 جاري تثبيت الاعتماديات...${colors.reset}`);
  
  try {
    // تثبيت الاعتماديات الإضافية المطلوبة لـ MySQL
    console.log(`${colors.yellow}📦 جاري تثبيت حزمة mysql2...${colors.reset}`);
    execSync('npm install mysql2 --save', { stdio: 'inherit' });
    
    // تحديث الاعتماديات الموجودة
    console.log(`${colors.yellow}🔄 جاري تحديث الاعتماديات الموجودة...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    
    console.log(`${colors.green}✓ تم تثبيت الاعتماديات بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء تثبيت الاعتماديات: ${error.message}${colors.reset}`);
    return false;
  }
}

// تطبيق تغييرات MySQL على الكود
function applyMySQLChanges() {
  console.log(`${colors.yellow}🔄 جاري تطبيق تغييرات MySQL على الكود...${colors.reset}`);
  
  try {
    // تشغيل سكربت تحديث اتصال قاعدة البيانات
    console.log(`${colors.yellow}🔄 جاري تحديث ملفات اتصال قاعدة البيانات...${colors.reset}`);
    
    // استخدام process.argv[2] === '--auto' للتنفيذ التلقائي بدون تأكيد من المستخدم
    if (process.argv[2] === '--auto') {
      // نسخ الملفات يدويًا بدلاً من تشغيل السكربت التفاعلي
      const dbUpdaterPath = path.join(rootDir, 'install', 'scripts', 'update-db-config.js');
      
      // استدعاء الدوال من هذا الملف مباشرة
      const { updateDbFile, updateSchemaFile, updateDrizzleConfig } = require(dbUpdaterPath);
      
      const dbVars = {
        DB_HOST: dbInfo.host,
        DB_PORT: dbInfo.port,
        DB_USER: dbInfo.user,
        DB_PASSWORD: dbInfo.password,
        DB_NAME: dbInfo.name
      };
      
      const dbUpdated = updateDbFile(dbVars);
      const schemaUpdated = updateSchemaFile();
      const drizzleUpdated = updateDrizzleConfig();
      
      if (dbUpdated && schemaUpdated && drizzleUpdated) {
        console.log(`${colors.green}✓ تم تحديث ملفات اتصال قاعدة البيانات بنجاح${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ حدث خطأ أثناء تحديث ملفات اتصال قاعدة البيانات${colors.reset}`);
        return false;
      }
    } else {
      // في حالة التثبيت التفاعلي، نشغل السكربت ونطلب من المستخدم التأكيد
      console.log(`${colors.yellow}⚠️ سيتم تشغيل سكربت تحديث اتصال قاعدة البيانات. يرجى الإجابة بـ "نعم" عند ظهور الطلب.${colors.reset}`);
      execSync('node install/scripts/update-db-config.js', { stdio: 'inherit' });
    }
    
    console.log(`${colors.green}✓ تم تطبيق تغييرات MySQL على الكود بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء تطبيق تغييرات MySQL: ${error.message}${colors.reset}`);
    return false;
  }
}

// إنشاء واستيراد قاعدة البيانات
async function setupDatabase(dbInfo) {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}🗄️ جاري إعداد قاعدة البيانات...${colors.reset}`);
    
    rl.question(`${colors.yellow}هل تريد إنشاء قاعدة البيانات واستيراد الهيكل والبيانات الأولية؟ (نعم/لا): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() !== 'نعم' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(`${colors.yellow}⚠️ تم تخطي إعداد قاعدة البيانات${colors.reset}`);
        resolve(true);
        return;
      }
      
      try {
        // التحقق من قدرة المستخدم على إنشاء قاعدة بيانات
        // هذا يعتمد على وجود أداة mysql في النظام
        const createDbCommand = `mysql -h ${dbInfo.host} -P ${dbInfo.port} -u ${dbInfo.user} -p${dbInfo.password} -e "CREATE DATABASE IF NOT EXISTS \`${dbInfo.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;
        
        try {
          console.log(`${colors.yellow}🗄️ جاري إنشاء قاعدة البيانات...${colors.reset}`);
          execSync(createDbCommand, { stdio: 'ignore' });
          console.log(`${colors.green}✓ تم إنشاء قاعدة البيانات بنجاح${colors.reset}`);
        } catch (error) {
          console.log(`${colors.red}✗ حدث خطأ أثناء إنشاء قاعدة البيانات: ${error.message}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ يرجى التأكد من صحة بيانات الاتصال وأن المستخدم لديه صلاحيات إنشاء قاعدة بيانات${colors.reset}`);
          console.log(`${colors.yellow}⚠️ يمكنك إنشاء قاعدة البيانات يدويًا واستيراد الملفات من المسارات التالية:${colors.reset}`);
          console.log(`${colors.yellow}  - هيكل قاعدة البيانات: ${mysqlSchemaPath}${colors.reset}`);
          console.log(`${colors.yellow}  - البيانات الأولية: ${mysqlSeedPath}${colors.reset}`);
          
          rl.question(`${colors.yellow}هل تريد المتابعة بافتراض أن قاعدة البيانات موجودة؟ (نعم/لا): ${colors.reset}`, (answer) => {
            if (answer.toLowerCase() !== 'نعم' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
              console.log(`${colors.red}✗ تم إلغاء التثبيت${colors.reset}`);
              resolve(false);
              return;
            }
            
            // المتابعة بدون إنشاء قاعدة البيانات
            resolve(true);
          });
          return;
        }
        
        // استيراد هيكل قاعدة البيانات
        const importSchemaCommand = `mysql -h ${dbInfo.host} -P ${dbInfo.port} -u ${dbInfo.user} -p${dbInfo.password} ${dbInfo.name} < "${mysqlSchemaPath}"`;
        
        try {
          console.log(`${colors.yellow}🗄️ جاري استيراد هيكل قاعدة البيانات...${colors.reset}`);
          execSync(importSchemaCommand, { stdio: 'ignore' });
          console.log(`${colors.green}✓ تم استيراد هيكل قاعدة البيانات بنجاح${colors.reset}`);
        } catch (error) {
          console.log(`${colors.red}✗ حدث خطأ أثناء استيراد هيكل قاعدة البيانات: ${error.message}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ يمكنك استيراد هيكل قاعدة البيانات يدويًا من المسار: ${mysqlSchemaPath}${colors.reset}`);
          
          rl.question(`${colors.yellow}هل تريد المتابعة؟ (نعم/لا): ${colors.reset}`, (answer) => {
            if (answer.toLowerCase() !== 'نعم' && answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
              console.log(`${colors.red}✗ تم إلغاء التثبيت${colors.reset}`);
              resolve(false);
              return;
            }
            
            // المتابعة بدون استيراد هيكل قاعدة البيانات
            resolve(true);
          });
          return;
        }
        
        // استيراد البيانات الأولية
        const importSeedCommand = `mysql -h ${dbInfo.host} -P ${dbInfo.port} -u ${dbInfo.user} -p${dbInfo.password} ${dbInfo.name} < "${mysqlSeedPath}"`;
        
        try {
          console.log(`${colors.yellow}🗄️ جاري استيراد البيانات الأولية...${colors.reset}`);
          execSync(importSeedCommand, { stdio: 'ignore' });
          console.log(`${colors.green}✓ تم استيراد البيانات الأولية بنجاح${colors.reset}`);
        } catch (error) {
          console.log(`${colors.red}✗ حدث خطأ أثناء استيراد البيانات الأولية: ${error.message}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ يمكنك استيراد البيانات الأولية يدويًا من المسار: ${mysqlSeedPath}${colors.reset}`);
        }
        
        resolve(true);
      } catch (error) {
        console.log(`${colors.red}✗ حدث خطأ أثناء إعداد قاعدة البيانات: ${error.message}${colors.reset}`);
        resolve(false);
      }
    });
  });
}

// بناء التطبيق (وضع الإنتاج)
function buildApp() {
  console.log(`${colors.yellow}🔨 جاري بناء التطبيق لوضع الإنتاج...${colors.reset}`);
  
  try {
    // بناء التطبيق
    console.log(`${colors.yellow}🔨 جاري تنفيذ أمر البناء...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log(`${colors.green}✓ تم بناء التطبيق بنجاح${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء بناء التطبيق: ${error.message}${colors.reset}`);
    return false;
  }
}

// إنشاء ملف تكوين nginx
function createNginxConfig(appInfo) {
  console.log(`${colors.yellow}🔧 جاري إنشاء ملف تكوين nginx...${colors.reset}`);
  
  try {
    const domain = new URL(appInfo.url).hostname;
    const nginxConfig = `# تكوين Nginx لتطبيق الشهادات
server {
    listen 80;
    server_name ${domain};
    
    # إعادة توجيه HTTP إلى HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${domain};
    
    # إعدادات SSL (يجب تعديلها وفقًا لإعدادات الشهادة)
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # المسار الجذر
    root /path/to/app/client/dist;
    
    # ملف الفهرس
    index index.html;
    
    # إعدادات الكاش
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # توجيه طلبات API إلى خادم Node.js
    location /api {
        proxy_pass http://localhost:${appInfo.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # توجيه طلبات الملفات الثابتة إلى المجلد الصحيح
    location /static {
        alias /path/to/app/client/static;
        expires 30d;
    }
    
    # توجيه طلبات الرفع إلى المجلد الصحيح
    location /uploads {
        alias /path/to/app/uploads;
    }
    
    # توجيه جميع الطلبات الأخرى إلى تطبيق الواجهة الأمامية
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;
    
    const nginxConfigPath = path.join(rootDir, 'install', 'config', 'nginx.conf');
    fs.writeFileSync(nginxConfigPath, nginxConfig, 'utf-8');
    console.log(`${colors.green}✓ تم إنشاء ملف تكوين nginx بنجاح: ${nginxConfigPath}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء إنشاء ملف تكوين nginx: ${error.message}${colors.reset}`);
    return false;
  }
}

// إنشاء ملف لتشغيل التطبيق مع PM2
function createPM2Config() {
  console.log(`${colors.yellow}🔧 جاري إنشاء ملف تكوين PM2...${colors.reset}`);
  
  try {
    const pm2Config = `{
  "apps": [
    {
      "name": "certificates-app",
      "script": "server/index.js",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production"
      },
      "max_memory_restart": "500M",
      "watch": false,
      "time": true,
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "error_file": "logs/error.log",
      "out_file": "logs/out.log",
      "log_file": "logs/combined.log"
    }
  ]
}`;
    
    const pm2ConfigPath = path.join(rootDir, 'ecosystem.config.json');
    fs.writeFileSync(pm2ConfigPath, pm2Config, 'utf-8');
    console.log(`${colors.green}✓ تم إنشاء ملف تكوين PM2 بنجاح: ${pm2ConfigPath}${colors.reset}`);
    
    // إنشاء مجلد السجلات
    const logsDir = path.join(rootDir, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ حدث خطأ أثناء إنشاء ملف تكوين PM2: ${error.message}${colors.reset}`);
    return false;
  }
}

// إنشاء نص عشوائي لاستخدامه كمفتاح سري
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// طباعة تعليمات ما بعد التثبيت
function printPostInstallInstructions(appInfo) {
  console.log(`${colors.cyan}${colors.bright}
╭──────────────────────────────────────────────────────╮
│                                                      │
│   🎉 تم التثبيت بنجاح!                              │
│                                                      │
╰──────────────────────────────────────────────────────╯
${colors.reset}`);
  
  console.log(`${colors.green}تم إعداد التطبيق بنجاح. إليك بعض التعليمات للخطوات التالية:${colors.reset}`);
  
  console.log(`${colors.yellow}1. تكوين خادم الويب Nginx:${colors.reset}`);
  console.log(`   - قم بنسخ محتوى الملف ${colors.cyan}install/config/nginx.conf${colors.reset} إلى مجلد تكوين Nginx`);
  console.log(`   - قم بتعديل المسارات في الملف لتتوافق مع موقع التطبيق على الخادم`);
  console.log(`   - قم بإعادة تشغيل Nginx بعد تحديث التكوين`);
  
  console.log(`${colors.yellow}2. تشغيل التطبيق:${colors.reset}`);
  console.log(`   - للتشغيل باستخدام PM2: ${colors.cyan}pm2 start ecosystem.config.json${colors.reset}`);
  console.log(`   - للتشغيل مباشرة: ${colors.cyan}NODE_ENV=production node server/index.js${colors.reset}`);
  
  console.log(`${colors.yellow}3. الوصول إلى التطبيق:${colors.reset}`);
  console.log(`   - واجهة المستخدم: ${colors.cyan}${appInfo.url}${colors.reset}`);
  console.log(`   - واجهة الإدارة: ${colors.cyan}${appInfo.url}/admin${colors.reset}`);
  console.log(`   - بيانات المسؤول الافتراضية:`);
  console.log(`     اسم المستخدم: ${colors.cyan}admin${colors.reset}`);
  console.log(`     كلمة المرور: ${colors.cyan}700700${colors.reset}`);
  
  console.log(`${colors.yellow}4. ملاحظات هامة:${colors.reset}`);
  console.log(`   - تأكد من تغيير كلمة مرور المسؤول الافتراضية بعد تسجيل الدخول لأول مرة`);
  console.log(`   - إذا كنت تواجه أي مشاكل، تحقق من ملفات السجل في مجلد ${colors.cyan}logs/${colors.reset}`);
  console.log(`   - تأكد من صحة تكوين SSL في ملف Nginx لضمان اتصال آمن`);
  
  console.log(`${colors.magenta}شكراً لاستخدام تطبيق إدارة الشهادات! 🙏${colors.reset}`);
}

// الدالة الرئيسية
async function main() {
  let dbInfo, appInfo;
  
  printWelcome();
  
  // التحقق من المتطلبات
  const reqCheck = await checkRequirements();
  if (!reqCheck) {
    console.log(`${colors.red}✗ فشل التحقق من المتطلبات. يرجى التأكد من توفر جميع المتطلبات ثم حاول مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // جمع معلومات قاعدة البيانات
  dbInfo = await collectDatabaseInfo();
  
  // جمع معلومات التطبيق
  appInfo = await collectAppInfo();
  
  // إنشاء ملف .env
  const envCreated = createEnvFile(dbInfo, appInfo);
  if (!envCreated) {
    console.log(`${colors.red}✗ فشل إنشاء ملف .env. يرجى المحاولة مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // تثبيت الاعتماديات
  const depsInstalled = installDependencies();
  if (!depsInstalled) {
    console.log(`${colors.red}✗ فشل تثبيت الاعتماديات. يرجى المحاولة مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // تطبيق تغييرات MySQL
  const mysqlChangesApplied = applyMySQLChanges();
  if (!mysqlChangesApplied) {
    console.log(`${colors.red}✗ فشل تطبيق تغييرات MySQL. يرجى المحاولة مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // إعداد قاعدة البيانات
  const dbSetup = await setupDatabase(dbInfo);
  if (!dbSetup) {
    console.log(`${colors.red}✗ فشل إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // بناء التطبيق
  const appBuilt = buildApp();
  if (!appBuilt) {
    console.log(`${colors.red}✗ فشل بناء التطبيق. يرجى المحاولة مرة أخرى.${colors.reset}`);
    rl.close();
    return;
  }
  
  // إنشاء ملف تكوين nginx
  createNginxConfig(appInfo);
  
  // إنشاء ملف تكوين PM2
  createPM2Config();
  
  // طباعة تعليمات ما بعد التثبيت
  printPostInstallInstructions(appInfo);
  
  rl.close();
}

// تشغيل السكربت
main().catch(error => {
  console.error(`${colors.red}حدث خطأ غير متوقع:${colors.reset}`, error);
  rl.close();
});