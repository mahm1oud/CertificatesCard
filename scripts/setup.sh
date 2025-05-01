#!/bin/bash

# إعداد المشروع بتثبيت الحزم وإعداد البيئة

echo "🔧 إعداد مشروع Certificates Card..."
echo "🔧 تثبيت الإعتماديات المشتركة..."

# إنشاء مجلدات إذا لم تكن موجودة
mkdir -p uploads
mkdir -p uploads/generated
mkdir -p temp

# تثبيت الحزم للـ Frontend
echo "📦 تثبيت حزم الواجهة الأمامية..."
cd client && npm install
cd ..

# تثبيت الحزم للـ Backend
echo "📦 تثبيت حزم الواجهة الخلفية..."
cd server && npm install
cd ..

# إنشاء قاعدة البيانات إذا لم تكن موجودة
if [ -f ".env" ] && [ -n "$(grep DATABASE_URL .env)" ]; then
  echo "🗄️ تحديث مخطط قاعدة البيانات..."
  npm run db:push
else
  echo "⚠️ لم يتم العثور على متغير البيئة DATABASE_URL. سيتم تخطي تحديث قاعدة البيانات."
fi

echo "✅ تم الإعداد بنجاح!"
echo "🚀 لبدء التطوير، قم بتشغيل 'npm run dev'"
echo "🏗️ لبناء المشروع، قم بتشغيل 'npm run build'"