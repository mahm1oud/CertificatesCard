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

# العودة للمجلد الرئيسي
cd ..

# نسخ الأصول والملفات المشتركة
echo "📦 نسخ الأصول والملفات المشتركة..."
./scripts/copy-assets.sh

# إنشاء نسخة من مجلد uploads في الواجهة الخلفية
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
  echo "📤 نسخ الملفات المرفوعة الموجودة..."
  cp -r uploads/* server/dist/uploads/
fi

echo "🎉 تم بناء المشروع بنجاح!"
echo "📁 الملفات الناتجة:"
echo "  - واجهة أمامية: ./client/dist/"
echo "  - واجهة خلفية: ./server/dist/"
echo ""
echo "🚀 للنشر على استضافات منفصلة:"
echo "  1. انشر محتويات client/dist على استضافة Frontend (مثل Netlify أو Vercel)"
echo "  2. انشر محتويات server/dist على استضافة Backend (مثل Render أو Heroku)"
echo "  3. تأكد من تعديل ملفات .env للإشارة إلى العناوين الصحيحة"