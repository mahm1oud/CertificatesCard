#!/bin/bash

# إعداد المشروع بتثبيت الحزم وإعداد البيئة

echo "🔧 إعداد مشروع Certificates Card..."

# تكوين المجلدات المشتركة والأصول
echo "🔧 تكوين المجلدات المشتركة والأصول..."
./scripts/configure-assets.sh

# تثبيت الحزم للـ Frontend
echo "📦 تثبيت حزم الواجهة الأمامية..."
cd client && npm install
if [ $? -ne 0 ]; then
  echo "⚠️ فشل تثبيت حزم الواجهة الأمامية. يرجى التحقق من سجل الأخطاء."
else
  echo "✅ تم تثبيت حزم الواجهة الأمامية بنجاح."
fi
cd ..

# تثبيت الحزم للـ Backend
echo "📦 تثبيت حزم الواجهة الخلفية..."
cd server && npm install
if [ $? -ne 0 ]; then
  echo "⚠️ فشل تثبيت حزم الواجهة الخلفية. يرجى التحقق من سجل الأخطاء."
else
  echo "✅ تم تثبيت حزم الواجهة الخلفية بنجاح."
fi
cd ..

# إنشاء قاعدة البيانات إذا لم تكن موجودة
if [ -f ".env" ] && [ -n "$(grep DATABASE_URL .env)" ]; then
  echo "🗄️ تحديث مخطط قاعدة البيانات..."
  npm run db:push
else
  echo "⚠️ لم يتم العثور على متغير البيئة DATABASE_URL. سيتم تخطي تحديث قاعدة البيانات."
fi

echo "✅ تم إعداد المشروع بنجاح!"
echo ""
echo "🚀 للعمل في بيئة التطوير:"
echo "  - لتشغيل النظام المتكامل: npm run dev"
echo "  - لتشغيل الواجهة الأمامية فقط: npm run dev:frontend"
echo "  - لتشغيل الواجهة الخلفية فقط: npm run dev:backend"
echo ""
echo "🏗️ لبناء المشروع للنشر:"
echo "  - لبناء المشروع بالكامل: npm run build"
echo "  - لبناء الواجهة الأمامية فقط: npm run build:frontend"
echo "  - لبناء الواجهة الخلفية فقط: npm run build:backend"
echo ""
echo "📚 لمزيد من المعلومات حول النشر، راجع ملف DEPLOY.md"