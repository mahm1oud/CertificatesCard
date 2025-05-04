#!/bin/bash

# سكريبت تجميع الملفات للنشر
echo "📦 بدء تجميع ملفات النشر..."

# إنشاء مجلد build إذا لم يكن موجوداً
mkdir -p build build/client build/server build/install

# نسخ ملفات الواجهة
echo "🔄 نسخ ملفات الواجهة..."
if [ -d "client/dist" ]; then
    cp -r client/dist/* build/client/
    echo "✅ تم نسخ ملفات الواجهة بنجاح"
else
    echo "⚠️ مجلد client/dist غير موجود. يرجى تنفيذ build-client.sh أولاً"
    exit 1
fi

# نسخ ملفات الخادم
echo "🔄 نسخ ملفات الخادم..."
if [ -d "server/dist" ]; then
    cp -r server/dist/* build/server/
    echo "✅ تم نسخ ملفات الخادم بنجاح"
else
    echo "⚠️ مجلد server/dist غير موجود. يرجى تنفيذ build-server.sh أولاً"
    exit 1
fi

# نسخ الملفات الإضافية
echo "🔄 نسخ الملفات الإضافية..."
cp -r uploads build/
cp -r temp build/
cp -r fonts build/
cp -r shared build/
cp -r install/* build/install/

# إنشاء ملف .htaccess
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

# إنشاء ملف PHP لصفحة التثبيت
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

echo "✅ تم تجميع ملفات النشر بنجاح!"
echo "📦 الملفات جاهزة للنشر في مجلد: build"
echo "📋 قائمة محتويات مجلد build:"
ls -la build/