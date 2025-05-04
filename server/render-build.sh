#!/bin/bash

# سكريبت بناء للنشر على منصة Render

# استبدال ملف package.json الرئيسي بملف package.json.render
echo "📋 استبدال ملف package.json بملف package.json.render..."
cp package.json.render package.json

# تثبيت الحزم
echo "📦 تثبيت الحزم المطلوبة..."
npm install

# بناء التطبيق
echo "🛠️ بناء التطبيق..."
npm run build

echo "✅ تم إكمال عملية البناء بنجاح!"
echo "📂 الملفات موجودة في مجلد: dist"
ls -la dist/