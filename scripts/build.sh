#!/bin/bash

# سكريبت بناء المشروع للإنتاج (Frontend و Backend)

echo "🏗️ بدء عملية بناء المشروع للإنتاج..."

# بناء الفرونت إند
echo "🔨 بناء الواجهة الأمامية (Frontend)..."
cd client && npm run build
if [ $? -ne 0 ]; then
  echo "❌ فشل بناء الواجهة الأمامية!"
  exit 1
fi
echo "✅ تم بناء الواجهة الأمامية بنجاح."

# بناء الباك إند
echo "🔨 بناء الواجهة الخلفية (Backend)..."
cd ../server && npm run build
if [ $? -ne 0 ]; then
  echo "❌ فشل بناء الواجهة الخلفية!"
  exit 1
fi
echo "✅ تم بناء الواجهة الخلفية بنجاح."

# نسخ الملفات المشتركة
echo "📂 نسخ الملفات المشتركة المطلوبة..."
mkdir -p ./dist/shared
cp -r ../shared ./dist/

# إنشاء ملفات للحفاظ على هيكل المجلد
mkdir -p ./dist/uploads
mkdir -p ./dist/uploads/generated
mkdir -p ./dist/temp
mkdir -p ./dist/fonts

# نسخ الخطوط
echo "🔤 نسخ ملفات الخطوط..."
cp -r ../fonts ./dist/

echo "🎉 تم بناء المشروع بنجاح!"
echo "📁 الملفات الناتجة:"
echo "  - واجهة أمامية: ./client/dist/"
echo "  - واجهة خلفية: ./server/dist/"
echo ""
echo "🚀 للنشر على استضافات منفصلة:"
echo "  1. انشر محتويات client/dist على استضافة Frontend"
echo "  2. انشر محتويات server/dist و shared/ على استضافة Backend"
echo "  3. تأكد من تعديل ملفات .env للإشارة إلى العناوين الصحيحة"