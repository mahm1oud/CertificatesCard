#!/bin/bash

# سكريبت بناء التطبيق في مجلد واحد
# يقوم هذا السكريبت ببناء كل من الواجهة والخادم في مجلد build

echo "🔄 بدء عملية البناء في مجلد build..."

# إنشاء مجلدات البناء إذا لم تكن موجودة
mkdir -p build build/client build/server

# 1. بناء الواجهة الأمامية
echo "🛠️ بناء الواجهة الأمامية (Frontend)..."
cd client

# خيار 1: بناء client/dist ثم نسخه
echo "  خيار 1: بناء dist/ ثم نسخه إلى build/client"
if npx vite build; then
  echo "  ✅ تم بناء الواجهة الأمامية بنجاح في client/dist"
  echo "  📦 نسخ الملفات إلى build/client"
  mkdir -p ../build/client
  cp -r dist/* ../build/client/
else
  echo "  ⚠️ فشل في بناء الواجهة الأمامية!"
  echo "  📦 محاولة بديلة: بناء مباشرة إلى build/client"
  npx vite build --outDir ../build/client
fi
cd ..

# 2. بناء الخادم
echo "🛠️ بناء الخادم (Backend)..."
cd server

# خيار 1: بناء server/dist ثم نسخه
echo "  خيار 1: بناء dist/ ثم نسخه إلى build/server"
if npx esbuild index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; then
  echo "  ✅ تم بناء الخادم بنجاح في server/dist"
  echo "  📦 نسخ الملفات إلى build/server"
  mkdir -p ../build/server
  cp -r dist/* ../build/server/
else
  echo "  ⚠️ فشل في بناء الخادم!"
  echo "  📦 محاولة بديلة: بناء مباشرة إلى build/server"
  cd ..
  npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=build/server
fi
cd ..

# 3. نسخ الملفات الإضافية
echo "📂 نسخ الملفات الإضافية..."
cp -r uploads build/
cp -r temp build/
cp -r fonts build/
cp -r shared build/
mkdir -p build/install
cp -r install/* build/install/

# 4. إنشاء ملف .htaccess
echo "📝 إنشاء ملف .htaccess للاستضافة..."
cat > build/.htaccess << 'EOL'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # إذا كان الطلب لملف أو مجلد موجود، قم بتقديمه مباشرة
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # إعادة توجيه طلبات API
    RewriteRule ^api/(.*)$ server/api.php [L,QSA]
    
    # إعادة توجيه كل الطلبات الأخرى إلى التطبيق الرئيسي
    RewriteRule ^ index.php [L]
</IfModule>

# ضغط الاستجابة
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOL

# 5. إنشاء ملف PHP لصفحة التثبيت
echo "📝 إنشاء ملف PHP لصفحة التثبيت..."
cat > build/index.php << 'EOL'
<?php
/**
 * الصفحة الرئيسية للتطبيق
 */

// تحقق من وجود ملف التثبيت
$installFilePath = __DIR__ . '/install/installer.php';
$configFilePath = __DIR__ . '/.env';

// إذا لم يكن ملف .env موجوداً، قم بتوجيه المستخدم إلى صفحة التثبيت
if (!file_exists($configFilePath)) {
    if (file_exists($installFilePath)) {
        header('Location: /install/installer.php');
        exit;
    }
}

// وإلا، ابدأ التطبيق الرئيسي
include_once __DIR__ . '/client/index.html';
?>
EOL

echo "✅ تم اكتمال عملية البناء بنجاح!"
echo "📦 الملفات الجاهزة للنشر موجودة في مجلد: build"
echo "ℹ️ لنشر التطبيق، قم بنقل محتويات مجلد build إلى مجلد public_html في استضافتك"