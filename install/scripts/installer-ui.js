#!/usr/bin/env node

/**
 * سكربت واجهة التثبيت التفاعلية
 * يقوم هذا السكربت بإنشاء واجهة ويب بسيطة لتسهيل عملية التثبيت
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec, execSync } = require('child_process');
const { parse } = require('url');
const { StringDecoder } = require('string_decoder');

// المسارات المهمة
const rootDir = process.cwd();
const configDir = path.join(rootDir, 'install', 'config');
const envTemplatePath = path.join(configDir, 'env.template');
const mysqlSchemaPath = path.join(rootDir, 'install', 'mysql', 'schema.sql');
const mysqlSeedPath = path.join(rootDir, 'install', 'mysql', 'seed.sql');

// الإعدادات
const PORT = process.env.INSTALLER_PORT || 3300;
const BASE_URL = `http://localhost:${PORT}`;

// حالة التثبيت
let installStatus = {
  stage: 'welcome', // welcome, requirements, database, app, installing, complete, error
  progress: 0,
  dbInfo: {
    host: 'localhost',
    port: '3306',
    name: '',
    user: '',
    password: ''
  },
  appInfo: {
    url: 'https://mycerts.example.com',
    port: '3000',
    sessionSecret: generateRandomString(32),
    cookieSecret: generateRandomString(32)
  },
  error: null,
  log: [],
  requirementsCheck: null
};

// التحقق من المتطلبات
function checkRequirements() {
  const results = {
    node: false,
    npm: false,
    mysql: false,
    requiredFiles: false,
    details: {
      node: { status: false, version: null, message: 'غير مثبت' },
      npm: { status: false, version: null, message: 'غير مثبت' },
      mysql: { status: false, version: null, message: 'غير مثبت' },
      requiredFiles: { status: false, message: 'الملفات المطلوبة غير موجودة' }
    }
  };
  
  try {
    // التحقق من Node.js
    const nodeVersion = execSync('node -v').toString().trim();
    results.details.node.version = nodeVersion;
    const version = nodeVersion.replace('v', '').split('.')[0];
    if (parseInt(version) >= 14) {
      results.details.node.status = true;
      results.details.node.message = `موجود (${nodeVersion})`;
      results.node = true;
    } else {
      results.details.node.message = `نسخة قديمة (${nodeVersion})، يرجى استخدام Node.js 14 أو أحدث`;
    }
  } catch (error) {
    results.details.node.message = 'غير مثبت أو غير موجود في مسار النظام';
  }
  
  try {
    // التحقق من npm
    const npmVersion = execSync('npm -v').toString().trim();
    results.details.npm.version = npmVersion;
    results.details.npm.status = true;
    results.details.npm.message = `موجود (${npmVersion})`;
    results.npm = true;
  } catch (error) {
    results.details.npm.message = 'غير مثبت أو غير موجود في مسار النظام';
  }
  
  try {
    // التحقق من MySQL
    const mysqlVersionOutput = execSync('mysql --version').toString().trim();
    const mysqlVersion = mysqlVersionOutput.match(/Distrib ([0-9.]+)/);
    results.details.mysql.version = mysqlVersion ? mysqlVersion[1] : mysqlVersionOutput;
    results.details.mysql.status = true;
    results.details.mysql.message = `موجود (${results.details.mysql.version})`;
    results.mysql = true;
  } catch (error) {
    results.details.mysql.message = 'غير مثبت محليًا أو غير موجود في مسار النظام';
  }
  
  // التحقق من الملفات المطلوبة
  const requiredFiles = [
    envTemplatePath,
    mysqlSchemaPath,
    mysqlSeedPath
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length === 0) {
    results.details.requiredFiles.status = true;
    results.details.requiredFiles.message = 'جميع الملفات المطلوبة موجودة';
    results.requiredFiles = true;
  } else {
    results.details.requiredFiles.message = `ملفات مفقودة: ${missingFiles.join(', ')}`;
  }
  
  // النتيجة النهائية
  results.success = results.node && results.npm && results.requiredFiles;
  
  return results;
}

// إنشاء ملف .env
function createEnvFile(dbInfo, appInfo) {
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
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
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

// تنفيذ عملية التثبيت في الخلفية
function runInstallation() {
  installStatus.stage = 'installing';
  installStatus.log.push('بدء عملية التثبيت...');
  installStatus.progress = 5;
  
  // 1. إنشاء ملف .env
  try {
    installStatus.log.push('جاري إنشاء ملف .env...');
    const envResult = createEnvFile(installStatus.dbInfo, installStatus.appInfo);
    if (!envResult.success) {
      throw new Error(`فشل إنشاء ملف .env: ${envResult.error}`);
    }
    installStatus.log.push('✅ تم إنشاء ملف .env بنجاح');
    installStatus.progress = 15;
  } catch (error) {
    installStatus.stage = 'error';
    installStatus.error = `فشل إنشاء ملف .env: ${error.message}`;
    installStatus.log.push(`❌ ${installStatus.error}`);
    return;
  }
  
  // 2. تثبيت الاعتماديات
  try {
    installStatus.log.push('جاري تثبيت الاعتماديات...');
    installStatus.log.push('جاري تثبيت حزمة mysql2...');
    
    exec('npm install mysql2 --save', (error) => {
      if (error) {
        installStatus.stage = 'error';
        installStatus.error = `فشل تثبيت mysql2: ${error.message}`;
        installStatus.log.push(`❌ ${installStatus.error}`);
        return;
      }
      
      installStatus.log.push('✅ تم تثبيت حزمة mysql2 بنجاح');
      installStatus.progress = 25;
      
      installStatus.log.push('جاري تحديث الاعتماديات الموجودة...');
      
      exec('npm install', (error) => {
        if (error) {
          installStatus.stage = 'error';
          installStatus.error = `فشل تحديث الاعتماديات: ${error.message}`;
          installStatus.log.push(`❌ ${installStatus.error}`);
          return;
        }
        
        installStatus.log.push('✅ تم تحديث الاعتماديات بنجاح');
        installStatus.progress = 40;
        
        // 3. تطبيق تغييرات MySQL على الكود
        try {
          installStatus.log.push('جاري تطبيق تغييرات MySQL على الكود...');
          
          // نسخ ملف الشيما الجديد
          const newSchemaPath = path.join(configDir, 'mysql.schema.ts');
          const backupSchemaPath = path.join(rootDir, 'shared', 'schema.ts.backup');
          const schemaPath = path.join(rootDir, 'shared', 'schema.ts');
          
          fs.copyFileSync(schemaPath, backupSchemaPath);
          fs.copyFileSync(newSchemaPath, schemaPath);
          
          // نسخ ملف التكوين الجديد
          const newConfigPath = path.join(configDir, 'drizzle.mysql.config.ts');
          const backupConfigPath = path.join(rootDir, 'drizzle.config.ts.backup');
          const configPath = path.join(rootDir, 'drizzle.config.ts');
          
          fs.copyFileSync(configPath, backupConfigPath);
          fs.copyFileSync(newConfigPath, configPath);
          
          // تحديث ملف db.ts
          const dbJsPath = path.join(rootDir, 'server', 'db.ts');
          let dbContent = fs.readFileSync(dbJsPath, 'utf-8');
          
          // استبدال استيرادات PostgreSQL بـ MySQL
          dbContent = dbContent.replace(
            /import { Pool } from ['"]pg['"];?/g,
            `import mysql from 'mysql2/promise';`
          );
          
          dbContent = dbContent.replace(
            /import { drizzle } from ['"]drizzle-orm\/postgres-js['"];?/g,
            `import { drizzle } from 'drizzle-orm/mysql2';`
          );
          
          // استبدال تكوين الاتصال
          const poolConfig = `// تكوين اتصال MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '${installStatus.dbInfo.host}',
  port: parseInt(process.env.DB_PORT || '${installStatus.dbInfo.port}', 10),
  user: process.env.DB_USER || '${installStatus.dbInfo.user}',
  password: process.env.DB_PASSWORD || '${installStatus.dbInfo.password}',
  database: process.env.DB_NAME || '${installStatus.dbInfo.name}',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});`;
          
          // استبدال إعدادات Pool
          dbContent = dbContent.replace(
            /let pool: Pool;[\s\S]*?};?/gm,
            poolConfig
          );
          
          // استبدال دالة فحص الاتصال
          const checkConnection = `export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('📊 تم الاتصال بقاعدة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    return false;
  }
}`;
          
          dbContent = dbContent.replace(
            /export async function checkDatabaseConnection[\s\S]*?}/g,
            checkConnection
          );
          
          fs.writeFileSync(dbJsPath, dbContent, 'utf-8');
          
          installStatus.log.push('✅ تم تطبيق تغييرات MySQL على الكود بنجاح');
          installStatus.progress = 60;
          
          // 4. إعداد قاعدة البيانات MySQL
          installStatus.log.push('جاري إعداد قاعدة البيانات...');
          
          try {
            // إنشاء قاعدة البيانات
            const createDbCommand = `mysql -h ${installStatus.dbInfo.host} -P ${installStatus.dbInfo.port} -u ${installStatus.dbInfo.user} -p${installStatus.dbInfo.password} -e "CREATE DATABASE IF NOT EXISTS \`${installStatus.dbInfo.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;
            
            exec(createDbCommand, (error) => {
              if (error) {
                installStatus.log.push(`⚠️ لم يتم إنشاء قاعدة البيانات: ${error.message}`);
                installStatus.log.push('⚠️ سنفترض أن قاعدة البيانات موجودة بالفعل ونتابع العملية');
              } else {
                installStatus.log.push('✅ تم إنشاء قاعدة البيانات بنجاح');
              }
              
              // استيراد هيكل قاعدة البيانات
              const importSchemaCommand = `mysql -h ${installStatus.dbInfo.host} -P ${installStatus.dbInfo.port} -u ${installStatus.dbInfo.user} -p${installStatus.dbInfo.password} ${installStatus.dbInfo.name} < "${mysqlSchemaPath}"`;
              
              exec(importSchemaCommand, (error) => {
                if (error) {
                  installStatus.log.push(`⚠️ لم يتم استيراد هيكل قاعدة البيانات: ${error.message}`);
                  installStatus.log.push('⚠️ قد تحتاج إلى استيراد هيكل قاعدة البيانات يدويًا');
                } else {
                  installStatus.log.push('✅ تم استيراد هيكل قاعدة البيانات بنجاح');
                }
                
                // استيراد البيانات الأولية
                const importSeedCommand = `mysql -h ${installStatus.dbInfo.host} -P ${installStatus.dbInfo.port} -u ${installStatus.dbInfo.user} -p${installStatus.dbInfo.password} ${installStatus.dbInfo.name} < "${mysqlSeedPath}"`;
                
                exec(importSeedCommand, (error) => {
                  if (error) {
                    installStatus.log.push(`⚠️ لم يتم استيراد البيانات الأولية: ${error.message}`);
                    installStatus.log.push('⚠️ قد تحتاج إلى استيراد البيانات الأولية يدويًا');
                  } else {
                    installStatus.log.push('✅ تم استيراد البيانات الأولية بنجاح');
                  }
                  
                  installStatus.progress = 80;
                  
                  // 5. بناء التطبيق
                  installStatus.log.push('جاري بناء التطبيق لوضع الإنتاج...');
                  
                  exec('npm run build', (error) => {
                    if (error) {
                      installStatus.stage = 'error';
                      installStatus.error = `فشل بناء التطبيق: ${error.message}`;
                      installStatus.log.push(`❌ ${installStatus.error}`);
                      return;
                    }
                    
                    installStatus.log.push('✅ تم بناء التطبيق بنجاح');
                    installStatus.progress = 95;
                    
                    // 6. إنشاء ملفات تكوين إضافية
                    installStatus.log.push('جاري إنشاء ملفات التكوين الإضافية...');
                    
                    // إنشاء ملف تكوين PM2
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
                    
                    // إنشاء مجلد السجلات
                    const logsDir = path.join(rootDir, 'logs');
                    if (!fs.existsSync(logsDir)) {
                      fs.mkdirSync(logsDir, { recursive: true });
                    }
                    
                    // إنشاء ملف تكوين nginx
                    try {
                      const domain = new URL(installStatus.appInfo.url).hostname;
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
        proxy_pass http://localhost:${installStatus.appInfo.port};
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
}`;
                      
                      const nginxConfigPath = path.join(rootDir, 'install', 'config', 'nginx.conf');
                      fs.writeFileSync(nginxConfigPath, nginxConfig, 'utf-8');
                    } catch (error) {
                      installStatus.log.push(`⚠️ لم يتم إنشاء ملف تكوين nginx: ${error.message}`);
                    }
                    
                    installStatus.log.push('✅ تم إنشاء ملفات التكوين بنجاح');
                    installStatus.log.push('✅ اكتملت عملية التثبيت بنجاح!');
                    installStatus.progress = 100;
                    installStatus.stage = 'complete';
                  });
                });
              });
            });
          } catch (error) {
            installStatus.log.push(`⚠️ حدث خطأ أثناء إعداد قاعدة البيانات: ${error.message}`);
            installStatus.log.push('⚠️ يمكنك إعداد قاعدة البيانات يدويًا باستخدام الملفات المتوفرة في مجلد install/mysql');
            
            // نتابع رغم وجود خطأ في إعداد قاعدة البيانات
            installStatus.progress = 70;
          }
        } catch (error) {
          installStatus.stage = 'error';
          installStatus.error = `فشل تطبيق تغييرات MySQL: ${error.message}`;
          installStatus.log.push(`❌ ${installStatus.error}`);
        }
      });
    });
  } catch (error) {
    installStatus.stage = 'error';
    installStatus.error = `فشل تثبيت الاعتماديات: ${error.message}`;
    installStatus.log.push(`❌ ${installStatus.error}`);
  }
}

// خادم HTTP البسيط لواجهة التثبيت
const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url || '/', true);
  const path = parsedUrl.pathname || '/';
  const query = parsedUrl.query;
  const method = req.method || 'GET';
  
  // التعامل مع طلبات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // واجهة المستخدم
  if (path === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getInstallerHTML());
    return;
  }
  
  // تحقق من حالة التثبيت الحالية
  if (path === '/api/status' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(installStatus));
    return;
  }
  
  // تحقق من المتطلبات
  if (path === '/api/check-requirements' && method === 'GET') {
    const results = checkRequirements();
    installStatus.requirementsCheck = results;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
    return;
  }
  
  // حفظ معلومات قاعدة البيانات
  if (path === '/api/database-info' && method === 'POST') {
    let body = '';
    const decoder = new StringDecoder('utf-8');
    
    req.on('data', (chunk) => {
      body += decoder.write(chunk);
    });
    
    req.on('end', () => {
      body += decoder.end();
      
      try {
        const data = JSON.parse(body);
        installStatus.dbInfo = {
          host: data.host || 'localhost',
          port: data.port || '3306',
          name: data.name || '',
          user: data.user || '',
          password: data.password || ''
        };
        
        installStatus.stage = 'app';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'بيانات غير صالحة' }));
      }
    });
    
    return;
  }
  
  // حفظ معلومات التطبيق
  if (path === '/api/app-info' && method === 'POST') {
    let body = '';
    const decoder = new StringDecoder('utf-8');
    
    req.on('data', (chunk) => {
      body += decoder.write(chunk);
    });
    
    req.on('end', () => {
      body += decoder.end();
      
      try {
        const data = JSON.parse(body);
        installStatus.appInfo = {
          url: data.url || 'https://mycerts.example.com',
          port: data.port || '3000',
          sessionSecret: installStatus.appInfo.sessionSecret,
          cookieSecret: installStatus.appInfo.cookieSecret
        };
        
        installStatus.stage = 'confirm';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'بيانات غير صالحة' }));
      }
    });
    
    return;
  }
  
  // بدء عملية التثبيت
  if (path === '/api/start-installation' && method === 'POST') {
    // التأكد من أن لدينا جميع المعلومات المطلوبة
    if (!installStatus.dbInfo.name || !installStatus.dbInfo.user) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'معلومات قاعدة البيانات غير مكتملة'
      }));
      return;
    }
    
    // بدء عملية التثبيت في الخلفية
    runInstallation();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  
  // إذا وصلنا إلى هنا، فالمسار غير موجود
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 - غير موجود');
});

// استماع على المنفذ المحدد
server.listen(PORT, () => {
  console.log(`🌟 بدأ خادم واجهة التثبيت على المنفذ ${PORT}`);
  console.log(`🌐 يمكنك الوصول إلى واجهة التثبيت من خلال: ${BASE_URL}`);
  
  // فتح المتصفح تلقائيًا (اختياري)
  try {
    const url = BASE_URL;
    const command = process.platform === 'win32' ? `start ${url}` :
                  process.platform === 'darwin' ? `open ${url}` :
                  `xdg-open ${url}`;
    exec(command);
  } catch (error) {
    console.log('لم نتمكن من فتح المتصفح تلقائيًا. يرجى فتح الرابط يدويًا.');
  }
});

// الحصول على HTML لواجهة التثبيت
function getInstallerHTML() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تثبيت تطبيق الشهادات</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 30px auto;
    }
    .installer-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .installer-logo {
      font-size: 50px;
      margin-bottom: 20px;
    }
    .installer-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .installer-subtitle {
      font-size: 18px;
      color: #6c757d;
      margin-bottom: 20px;
    }
    .step-container {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 30px;
      margin-bottom: 20px;
    }
    .step-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
    .step-icon {
      margin-left: 10px;
      font-size: 24px;
    }
    .step-content {
      margin-bottom: 20px;
    }
    .form-label {
      font-weight: 500;
    }
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .log-container {
      background-color: #343a40;
      color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      max-height: 300px;
      overflow-y: auto;
    }
    .log-entry {
      margin-bottom: 5px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .requirements-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #dee2e6;
    }
    .requirements-item:last-child {
      border-bottom: none;
    }
    .text-success {
      color: #28a745 !important;
    }
    .text-danger {
      color: #dc3545 !important;
    }
    .text-warning {
      color: #ffc107 !important;
    }
    .hidden {
      display: none;
    }
    .spinner-border {
      margin-left: 10px;
    }
    .complete-icon {
      font-size: 80px;
      color: #28a745;
      margin-bottom: 20px;
    }
    .secret-key {
      font-family: monospace;
      background-color: #f8f9fa;
      padding: 5px;
      border-radius: 3px;
    }
    .password-toggle {
      cursor: pointer;
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="installer-header">
      <div class="installer-logo">🏆</div>
      <h1 class="installer-title">تثبيت تطبيق الشهادات</h1>
      <p class="installer-subtitle">دليل التثبيت التفاعلي</p>
    </div>
    
    <!-- خطوات التثبيت -->
    <div id="welcomeStep" class="step-container">
      <div class="step-title">
        <span class="step-icon">👋</span>
        <span>مرحبًا بك!</span>
      </div>
      <div class="step-content">
        <p>مرحبًا بك في دليل تثبيت تطبيق الشهادات. سيساعدك هذا الدليل على تثبيت التطبيق على خادم الويب الخاص بك وتكوينه ليعمل مع قاعدة بيانات MySQL.</p>
        <p>قبل البدء، تأكد من توفر المتطلبات التالية:</p>
        <ul>
          <li>Node.js الإصدار 14 أو أعلى</li>
          <li>npm (مدير حزم Node.js)</li>
          <li>قاعدة بيانات MySQL</li>
          <li>خادم ويب (مثل Nginx أو Apache) - اختياري لبيئة التطوير</li>
        </ul>
        <p>انقر على الزر أدناه للتحقق من المتطلبات والبدء في عملية التثبيت.</p>
      </div>
      <div class="nav-buttons">
        <div></div>
        <button id="welcomeNextBtn" class="btn btn-primary">
          التحقق من المتطلبات
          <span id="welcomeSpinner" class="spinner-border spinner-border-sm hidden" role="status" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    
    <div id="requirementsStep" class="step-container hidden">
      <div class="step-title">
        <span class="step-icon">🔍</span>
        <span>التحقق من المتطلبات</span>
      </div>
      <div class="step-content">
        <p>يتم التحقق من توفر جميع المتطلبات الضرورية لتثبيت التطبيق:</p>
        
        <div id="requirementsList">
          <div class="requirements-item">
            <span>Node.js (v14+)</span>
            <span id="nodeStatus">جاري التحقق...</span>
          </div>
          <div class="requirements-item">
            <span>npm</span>
            <span id="npmStatus">جاري التحقق...</span>
          </div>
          <div class="requirements-item">
            <span>MySQL</span>
            <span id="mysqlStatus">جاري التحقق...</span>
          </div>
          <div class="requirements-item">
            <span>الملفات المطلوبة</span>
            <span id="filesStatus">جاري التحقق...</span>
          </div>
        </div>
        
        <div id="requirementsResult" class="alert hidden mt-3"></div>
      </div>
      <div class="nav-buttons">
        <button id="requirementsPrevBtn" class="btn btn-secondary">السابق</button>
        <button id="requirementsNextBtn" class="btn btn-primary" disabled>التالي</button>
      </div>
    </div>
    
    <div id="databaseStep" class="step-container hidden">
      <div class="step-title">
        <span class="step-icon">🗄️</span>
        <span>إعداد قاعدة البيانات</span>
      </div>
      <div class="step-content">
        <p>أدخل معلومات الاتصال بقاعدة بيانات MySQL:</p>
        
        <form id="databaseForm">
          <div class="mb-3">
            <label for="dbHost" class="form-label">الخادم</label>
            <input type="text" class="form-control" id="dbHost" value="localhost" required>
            <div class="form-text">عادة ما يكون "localhost" لقواعد البيانات المحلية</div>
          </div>
          
          <div class="mb-3">
            <label for="dbPort" class="form-label">المنفذ</label>
            <input type="text" class="form-control" id="dbPort" value="3306" required>
            <div class="form-text">المنفذ الافتراضي لـ MySQL هو 3306</div>
          </div>
          
          <div class="mb-3">
            <label for="dbName" class="form-label">اسم قاعدة البيانات</label>
            <input type="text" class="form-control" id="dbName" required>
            <div class="form-text">سيتم إنشاء قاعدة البيانات إذا لم تكن موجودة (إذا كان المستخدم لديه الصلاحيات المناسبة)</div>
          </div>
          
          <div class="mb-3">
            <label for="dbUser" class="form-label">اسم المستخدم</label>
            <input type="text" class="form-control" id="dbUser" required>
          </div>
          
          <div class="mb-3">
            <label for="dbPassword" class="form-label">كلمة المرور</label>
            <div class="position-relative">
              <input type="password" class="form-control" id="dbPassword">
              <span class="password-toggle" onclick="togglePasswordVisibility('dbPassword')">👁️</span>
            </div>
          </div>
        </form>
      </div>
      <div class="nav-buttons">
        <button id="databasePrevBtn" class="btn btn-secondary">السابق</button>
        <button id="databaseNextBtn" class="btn btn-primary">التالي</button>
      </div>
    </div>
    
    <div id="appStep" class="step-container hidden">
      <div class="step-title">
        <span class="step-icon">⚙️</span>
        <span>إعداد التطبيق</span>
      </div>
      <div class="step-content">
        <p>أدخل معلومات تكوين التطبيق:</p>
        
        <form id="appForm">
          <div class="mb-3">
            <label for="appUrl" class="form-label">عنوان URL للتطبيق</label>
            <input type="url" class="form-control" id="appUrl" value="https://mycerts.example.com" required>
            <div class="form-text">URL كامل للتطبيق (بما في ذلك https://)</div>
          </div>
          
          <div class="mb-3">
            <label for="appPort" class="form-label">منفذ التطبيق</label>
            <input type="text" class="form-control" id="appPort" value="3000" required>
            <div class="form-text">المنفذ الذي سيعمل عليه خادم Node.js</div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">مفتاح الجلسات (تم إنشاؤه تلقائيًا)</label>
            <div class="secret-key" id="sessionSecret"></div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">مفتاح الكوكيز (تم إنشاؤه تلقائيًا)</label>
            <div class="secret-key" id="cookieSecret"></div>
          </div>
        </form>
      </div>
      <div class="nav-buttons">
        <button id="appPrevBtn" class="btn btn-secondary">السابق</button>
        <button id="appNextBtn" class="btn btn-primary">التالي</button>
      </div>
    </div>
    
    <div id="confirmStep" class="step-container hidden">
      <div class="step-title">
        <span class="step-icon">✅</span>
        <span>تأكيد التثبيت</span>
      </div>
      <div class="step-content">
        <p>راجع المعلومات التالية قبل بدء عملية التثبيت:</p>
        
        <div class="card mb-3">
          <div class="card-header">معلومات قاعدة البيانات</div>
          <div class="card-body">
            <p class="mb-1"><strong>الخادم:</strong> <span id="confirmDbHost"></span></p>
            <p class="mb-1"><strong>المنفذ:</strong> <span id="confirmDbPort"></span></p>
            <p class="mb-1"><strong>اسم قاعدة البيانات:</strong> <span id="confirmDbName"></span></p>
            <p class="mb-1"><strong>اسم المستخدم:</strong> <span id="confirmDbUser"></span></p>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">معلومات التطبيق</div>
          <div class="card-body">
            <p class="mb-1"><strong>عنوان URL:</strong> <span id="confirmAppUrl"></span></p>
            <p class="mb-1"><strong>المنفذ:</strong> <span id="confirmAppPort"></span></p>
          </div>
        </div>
        
        <div class="alert alert-warning mt-3">
          <strong>تنبيه:</strong> ستقوم عملية التثبيت بالإجراءات التالية:
          <ul class="mb-0 mt-2">
            <li>إنشاء ملف .env بالإعدادات المحددة</li>
            <li>تثبيت الاعتماديات المطلوبة (بما في ذلك mysql2)</li>
            <li>تحديث ملفات التكوين للتوافق مع MySQL</li>
            <li>إنشاء قاعدة البيانات وجداولها إذا لم تكن موجودة</li>
            <li>إضافة البيانات الأولية إلى قاعدة البيانات</li>
            <li>بناء التطبيق لوضع الإنتاج</li>
          </ul>
        </div>
      </div>
      <div class="nav-buttons">
        <button id="confirmPrevBtn" class="btn btn-secondary">السابق</button>
        <button id="confirmInstallBtn" class="btn btn-success">بدء التثبيت</button>
      </div>
    </div>
    
    <div id="installStep" class="step-container hidden">
      <div class="step-title">
        <span class="step-icon">⏳</span>
        <span>جاري التثبيت</span>
      </div>
      <div class="step-content">
        <div class="progress mb-3">
          <div id="installProgress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">سجل التثبيت:</label>
          <div id="installLog" class="log-container"></div>
        </div>
      </div>
    </div>
    
    <div id="completeStep" class="step-container hidden">
      <div class="text-center mb-4">
        <div class="complete-icon">🎉</div>
        <h2>تم التثبيت بنجاح!</h2>
        <p class="lead">تم إعداد وتكوين تطبيق الشهادات بنجاح.</p>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">الخطوات التالية</div>
        <div class="card-body">
          <ol>
            <li class="mb-2">
              <strong>تكوين خادم الويب (Nginx/Apache):</strong>
              <p>تم إنشاء ملف تكوين Nginx في <code>install/config/nginx.conf</code>. قم بتعديله ونسخه إلى مجلد تكوينات خادم الويب.</p>
            </li>
            <li class="mb-2">
              <strong>تشغيل التطبيق:</strong>
              <p>استخدم PM2 لتشغيل التطبيق في الخلفية:</p>
              <pre class="bg-light p-2"><code>npm install -g pm2
pm2 start ecosystem.config.json</code></pre>
            </li>
            <li class="mb-2">
              <strong>الوصول إلى التطبيق:</strong>
              <p>يمكنك الوصول إلى التطبيق من خلال:</p>
              <p><strong>واجهة المستخدم:</strong> <a id="completeAppUrl" href="#" target="_blank"></a></p>
              <p><strong>واجهة الإدارة:</strong> <a id="completeAdminUrl" href="#" target="_blank"></a></p>
              <p><strong>بيانات المسؤول الافتراضية:</strong><br>
              اسم المستخدم: <code>admin</code><br>
              كلمة المرور: <code>700700</code></p>
            </li>
          </ol>
        </div>
      </div>
      
      <div class="alert alert-warning">
        <strong>ملاحظة هامة:</strong> تأكد من تغيير كلمة مرور المسؤول الافتراضية بعد تسجيل الدخول لأول مرة!
      </div>
    </div>
    
    <div id="errorStep" class="step-container hidden">
      <div class="step-title text-danger">
        <span class="step-icon">❌</span>
        <span>حدث خطأ</span>
      </div>
      <div class="step-content">
        <div class="alert alert-danger">
          <p id="errorMessage"></p>
        </div>
        
        <p>يمكنك الرجوع إلى الخطوات السابقة لتصحيح المشكلة، أو التحقق من سجل التثبيت لمزيد من المعلومات:</p>
        
        <div class="mb-3">
          <label class="form-label">سجل التثبيت:</label>
          <div id="errorLog" class="log-container"></div>
        </div>
      </div>
      <div class="nav-buttons">
        <button id="errorRetryBtn" class="btn btn-primary">حاول مرة أخرى</button>
      </div>
    </div>
  </div>
  
  <script>
    // المتغيرات العامة
    let currentInstallStatus = {
      stage: 'welcome',
      progress: 0,
      dbInfo: {
        host: 'localhost',
        port: '3306',
        name: '',
        user: '',
        password: ''
      },
      appInfo: {
        url: 'https://mycerts.example.com',
        port: '3000',
        sessionSecret: '',
        cookieSecret: ''
      },
      log: []
    };
    
    // تحديث الحالة من الخادم بشكل دوري
    let statusInterval;
    
    // إظهار خطوة معينة
    function showStep(stepName) {
      document.querySelectorAll('.step-container').forEach(container => {
        container.classList.add('hidden');
      });
      document.getElementById(stepName + 'Step').classList.remove('hidden');
    }
    
    // إخفاء/إظهار كلمة المرور
    function togglePasswordVisibility(inputId) {
      const input = document.getElementById(inputId);
      input.type = input.type === 'password' ? 'text' : 'password';
    }
    
    // التحقق من المتطلبات
    async function checkRequirements() {
      const spinner = document.getElementById('welcomeSpinner');
      spinner.classList.remove('hidden');
      
      try {
        const response = await fetch('/api/check-requirements');
        const result = await response.json();
        
        // تحديث حالة المتطلبات
        document.getElementById('nodeStatus').innerHTML = createStatusBadge(
          result.details.node.status,
          result.details.node.message
        );
        
        document.getElementById('npmStatus').innerHTML = createStatusBadge(
          result.details.npm.status,
          result.details.npm.message
        );
        
        document.getElementById('mysqlStatus').innerHTML = createStatusBadge(
          result.details.mysql.status,
          result.details.mysql.message
        );
        
        document.getElementById('filesStatus').innerHTML = createStatusBadge(
          result.details.requiredFiles.status,
          result.details.requiredFiles.message
        );
        
        // تحديث نتيجة التحقق
        const resultDiv = document.getElementById('requirementsResult');
        if (result.success) {
          resultDiv.classList.remove('hidden', 'alert-danger');
          resultDiv.classList.add('alert-success');
          resultDiv.innerHTML = '<strong>✓ جميع المتطلبات متوفرة!</strong> يمكنك المتابعة إلى الخطوة التالية.';
          document.getElementById('requirementsNextBtn').disabled = false;
        } else {
          resultDiv.classList.remove('hidden', 'alert-success');
          resultDiv.classList.add('alert-danger');
          resultDiv.innerHTML = '<strong>✗ بعض المتطلبات غير متوفرة.</strong> يرجى تثبيت أو تكوين المتطلبات المفقودة قبل المتابعة.';
          document.getElementById('requirementsNextBtn').disabled = !result.node;
        }
        
        spinner.classList.add('hidden');
        showStep('requirements');
      } catch (error) {
        console.error('Error checking requirements:', error);
        spinner.classList.add('hidden');
        alert('حدث خطأ أثناء التحقق من المتطلبات.');
      }
    }
    
    // إنشاء شارة حالة
    function createStatusBadge(status, message) {
      const badgeClass = status ? 'bg-success' : (message.includes('غير مثبت محليًا') ? 'bg-warning' : 'bg-danger');
      return \`<span class="badge \${badgeClass}">\${message}</span>\`;
    }
    
    // تقديم نموذج قاعدة البيانات
    function submitDatabaseForm() {
      const dbInfo = {
        host: document.getElementById('dbHost').value,
        port: document.getElementById('dbPort').value,
        name: document.getElementById('dbName').value,
        user: document.getElementById('dbUser').value,
        password: document.getElementById('dbPassword').value
      };
      
      // التحقق من صحة المدخلات
      if (!dbInfo.name || !dbInfo.user) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
      }
      
      // إرسال البيانات إلى الخادم
      fetch('/api/database-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbInfo)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          currentInstallStatus.dbInfo = dbInfo;
          showStep('app');
          
          // تحديث عرض مفاتيح الأمان
          fetch('/api/status')
            .then(response => response.json())
            .then(status => {
              document.getElementById('sessionSecret').textContent = status.appInfo.sessionSecret;
              document.getElementById('cookieSecret').textContent = status.appInfo.cookieSecret;
            });
        } else {
          alert('حدث خطأ: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error submitting database info:', error);
        alert('حدث خطأ أثناء إرسال معلومات قاعدة البيانات.');
      });
    }
    
    // تقديم نموذج التطبيق
    function submitAppForm() {
      const appInfo = {
        url: document.getElementById('appUrl').value,
        port: document.getElementById('appPort').value
      };
      
      // التحقق من صحة المدخلات
      if (!appInfo.url || !appInfo.port) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
      }
      
      // إرسال البيانات إلى الخادم
      fetch('/api/app-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appInfo)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          currentInstallStatus.appInfo = Object.assign({}, currentInstallStatus.appInfo, appInfo);
          updateConfirmationStep();
          showStep('confirm');
        } else {
          alert('حدث خطأ: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error submitting app info:', error);
        alert('حدث خطأ أثناء إرسال معلومات التطبيق.');
      });
    }
    
    // تحديث خطوة التأكيد
    function updateConfirmationStep() {
      // معلومات قاعدة البيانات
      document.getElementById('confirmDbHost').textContent = currentInstallStatus.dbInfo.host;
      document.getElementById('confirmDbPort').textContent = currentInstallStatus.dbInfo.port;
      document.getElementById('confirmDbName').textContent = currentInstallStatus.dbInfo.name;
      document.getElementById('confirmDbUser').textContent = currentInstallStatus.dbInfo.user;
      
      // معلومات التطبيق
      document.getElementById('confirmAppUrl').textContent = currentInstallStatus.appInfo.url;
      document.getElementById('confirmAppPort').textContent = currentInstallStatus.appInfo.port;
    }
    
    // بدء عملية التثبيت
    function startInstallation() {
      // إرسال طلب لبدء التثبيت
      fetch('/api/start-installation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showStep('install');
          startStatusPolling();
        } else {
          alert('حدث خطأ: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error starting installation:', error);
        alert('حدث خطأ أثناء بدء عملية التثبيت.');
      });
    }
    
    // بدء استطلاع حالة التثبيت
    function startStatusPolling() {
      // إيقاف الاستطلاع الحالي إذا كان موجودًا
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      
      // استطلاع حالة التثبيت كل ثانية
      statusInterval = setInterval(updateInstallStatus, 1000);
    }
    
    // تحديث حالة التثبيت
    async function updateInstallStatus() {
      try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // تحديث شريط التقدم
        const progressBar = document.getElementById('installProgress');
        progressBar.style.width = \`\${status.progress}%\`;
        progressBar.textContent = \`\${status.progress}%\`;
        progressBar.setAttribute('aria-valuenow', status.progress);
        
        // تحديث سجل التثبيت
        const logContainer = document.getElementById('installLog');
        if (status.log.length > 0) {
          // إضافة إدخالات السجل الجديدة فقط
          const currentLogLength = currentInstallStatus.log.length;
          const newLogEntries = status.log.slice(currentLogLength);
          
          newLogEntries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // تلوين الإدخالات بناءً على محتواها
            if (entry.includes('✅')) {
              logEntry.classList.add('text-success');
            } else if (entry.includes('❌')) {
              logEntry.classList.add('text-danger');
            } else if (entry.includes('⚠️')) {
              logEntry.classList.add('text-warning');
            }
            
            logEntry.textContent = entry;
            logContainer.appendChild(logEntry);
          });
          
          // تمرير لأسفل لرؤية أحدث الإدخالات
          logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        // التحقق من اكتمال التثبيت أو حدوث خطأ
        if (status.stage === 'complete') {
          clearInterval(statusInterval);
          document.getElementById('completeAppUrl').textContent = status.appInfo.url;
          document.getElementById('completeAppUrl').href = status.appInfo.url;
          document.getElementById('completeAdminUrl').textContent = \`\${status.appInfo.url}/admin\`;
          document.getElementById('completeAdminUrl').href = \`\${status.appInfo.url}/admin\`;
          showStep('complete');
        } else if (status.stage === 'error') {
          clearInterval(statusInterval);
          document.getElementById('errorMessage').textContent = status.error;
          document.getElementById('errorLog').innerHTML = '';
          status.log.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            if (entry.includes('✅')) {
              logEntry.classList.add('text-success');
            } else if (entry.includes('❌')) {
              logEntry.classList.add('text-danger');
            } else if (entry.includes('⚠️')) {
              logEntry.classList.add('text-warning');
            }
            
            logEntry.textContent = entry;
            document.getElementById('errorLog').appendChild(logEntry);
          });
          showStep('error');
        }
        
        // تحديث الحالة الحالية
        currentInstallStatus = status;
      } catch (error) {
        console.error('Error updating installation status:', error);
      }
    }
    
    // تهيئة الصفحة
    async function initPage() {
      // تحديث حالة التثبيت الحالية
      try {
        const response = await fetch('/api/status');
        currentInstallStatus = await response.json();
        
        // عرض الخطوة المناسبة بناءً على حالة التثبيت
        showStep(currentInstallStatus.stage);
        
        // تعبئة نماذج الإدخال بالقيم المحفوظة
        if (currentInstallStatus.stage !== 'welcome') {
          document.getElementById('dbHost').value = currentInstallStatus.dbInfo.host;
          document.getElementById('dbPort').value = currentInstallStatus.dbInfo.port;
          document.getElementById('dbName').value = currentInstallStatus.dbInfo.name;
          document.getElementById('dbUser').value = currentInstallStatus.dbInfo.user;
          document.getElementById('dbPassword').value = currentInstallStatus.dbInfo.password;
          
          document.getElementById('appUrl').value = currentInstallStatus.appInfo.url;
          document.getElementById('appPort').value = currentInstallStatus.appInfo.port;
          document.getElementById('sessionSecret').textContent = currentInstallStatus.appInfo.sessionSecret;
          document.getElementById('cookieSecret').textContent = currentInstallStatus.appInfo.cookieSecret;
          
          if (currentInstallStatus.stage === 'installing') {
            startStatusPolling();
          } else if (currentInstallStatus.stage === 'confirm') {
            updateConfirmationStep();
          }
        }
      } catch (error) {
        console.error('Error initializing page:', error);
      }
    }
    
    // أحداث النقر على الأزرار
    document.getElementById('welcomeNextBtn').addEventListener('click', checkRequirements);
    
    document.getElementById('requirementsPrevBtn').addEventListener('click', () => showStep('welcome'));
    document.getElementById('requirementsNextBtn').addEventListener('click', () => showStep('database'));
    
    document.getElementById('databasePrevBtn').addEventListener('click', () => showStep('requirements'));
    document.getElementById('databaseNextBtn').addEventListener('click', submitDatabaseForm);
    
    document.getElementById('appPrevBtn').addEventListener('click', () => showStep('database'));
    document.getElementById('appNextBtn').addEventListener('click', submitAppForm);
    
    document.getElementById('confirmPrevBtn').addEventListener('click', () => showStep('app'));
    document.getElementById('confirmInstallBtn').addEventListener('click', startInstallation);
    
    document.getElementById('errorRetryBtn').addEventListener('click', () => {
      document.getElementById('requirementsNextBtn').disabled = false;
      showStep('welcome');
    });
    
    // تهيئة الصفحة عند التحميل
    window.addEventListener('load', initPage);
  </script>
</body>
</html>`;
}

// بدء التنفيذ الرئيسي
const isInteractive = process.argv[2] !== '--auto';
if (isInteractive) {
  // لا شيء للفعل هنا، سيتم بدء الخادم تلقائيًا
} else {
  // التنفيذ التلقائي للتثبيت
  console.log('🔄 جاري التنفيذ التلقائي للتثبيت...');
  
  // قراءة المتغيرات البيئية أو استخدام القيم الافتراضية
  installStatus.dbInfo = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    name: process.env.DB_NAME || 'certificates',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
  
  installStatus.appInfo = {
    url: process.env.APP_URL || 'https://mycerts.example.com',
    port: process.env.PORT || '3000',
    sessionSecret: process.env.SESSION_SECRET || generateRandomString(32),
    cookieSecret: process.env.COOKIE_SECRET || generateRandomString(32)
  };
  
  // بدء عملية التثبيت
  runInstallation();
}