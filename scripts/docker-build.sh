#!/bin/bash

# سكريبت بناء صور Docker للواجهة الأمامية والخلفية

echo "🐳 بدء بناء صور Docker..."

# بناء المشروع أولاً
echo "🔨 بناء المشروع..."
./scripts/build.sh

# التحقق من نجاح عملية البناء
if [ $? -ne 0 ]; then
  echo "❌ فشل بناء المشروع. يرجى التحقق من الأخطاء وإعادة المحاولة."
  exit 1
fi

# بناء صورة Docker للواجهة الأمامية
echo "🔨 بناء صورة Docker للواجهة الأمامية..."
docker build -t certificates-frontend -f Dockerfile.frontend .

# التحقق من نجاح عملية البناء
if [ $? -ne 0 ]; then
  echo "❌ فشل بناء صورة Docker للواجهة الأمامية. يرجى التحقق من الأخطاء وإعادة المحاولة."
  exit 1
fi

# بناء صورة Docker للواجهة الخلفية
echo "🔨 بناء صورة Docker للواجهة الخلفية..."
docker build -t certificates-backend -f Dockerfile.backend .

# التحقق من نجاح عملية البناء
if [ $? -ne 0 ]; then
  echo "❌ فشل بناء صورة Docker للواجهة الخلفية. يرجى التحقق من الأخطاء وإعادة المحاولة."
  exit 1
fi

echo "✅ تم بناء صور Docker بنجاح!"
echo "🚀 لتشغيل التطبيق باستخدام Docker Compose، قم بتنفيذ الأمر التالي:"
echo "   docker-compose up -d"
echo ""
echo "📦 للنشر على نظام آخر، قم أولاً بحفظ الصور:"
echo "   docker save certificates-frontend | gzip > certificates-frontend.tar.gz"
echo "   docker save certificates-backend | gzip > certificates-backend.tar.gz"
echo ""
echo "ثم نقل الملفات إلى النظام الآخر وتحميلها:"
echo "   docker load < certificates-frontend.tar.gz"
echo "   docker load < certificates-backend.tar.gz"
echo ""
echo "وأخيراً تشغيل التطبيق باستخدام Docker Compose."