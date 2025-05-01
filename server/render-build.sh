#!/usr/bin/env bash
# سكريبت لبناء تطبيق الخادم على منصة Render

set -e

echo "🔨 بدء عملية بناء الخادم على Render..."

# التأكد من وجود package.json للخادم
if [ -f "package.json.render" ]; then
  echo "📝 استخدام package.json.render..."
  cp package.json.render package.json
fi

# تثبيت الاعتمادات
echo "📦 تثبيت الاعتمادات..."
npm install

# نسخة محلية من ملف vite.config.ts
if [ ! -f "vite.config.ts" ] && [ -f "../vite.config.ts" ]; then
  echo "🔄 نسخ vite.config.ts..."
  cp ../vite.config.ts ./
fi

# تأكد من وجود المجلدات الضرورية
echo "📂 إنشاء المجلدات اللازمة..."
mkdir -p uploads
mkdir -p temp
mkdir -p fonts

# بناء التطبيق
echo "🛠️ بناء التطبيق..."
npm run build

echo "✅ تم بناء الخادم بنجاح!"