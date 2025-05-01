#!/bin/bash

# سكريبت إعداد وتكوين الأصول والمجلدات المشتركة للمشروع
# يستخدم هذا السكريبت للتأكد من وجود كافة المجلدات والملفات اللازمة

echo "🔧 تكوين الأصول والمجلدات المشتركة..."

# إنشاء بنية المجلدات الأساسية
mkdir -p fonts
mkdir -p shared
mkdir -p temp
mkdir -p uploads/generated
mkdir -p uploads/logos
mkdir -p uploads/signatures
mkdir -p uploads/images

# إنشاء ملفات .gitkeep للحفاظ على هيكل المجلدات في Git
touch fonts/.gitkeep
touch shared/.gitkeep
touch temp/.gitkeep
touch uploads/.gitkeep
touch uploads/generated/.gitkeep
touch uploads/logos/.gitkeep
touch uploads/signatures/.gitkeep
touch uploads/images/.gitkeep

# التحقق من وجود مجلد الخطوط وإنشاء ملف readme إذا لم يكن موجوداً
if [ ! -f "fonts/README.md" ]; then
  echo "# مجلد الخطوط

هذا المجلد يحتوي على الخطوط المستخدمة في تطبيق إصدار البطاقات والشهادات.

## الخطوط المدعومة

- خط Cairo
- خط Tajawal
- خط Amiri
- خط Lateef
- خط Scheherazade

## كيفية إضافة خطوط جديدة

1. ضع ملفات الخط (بصيغة TTF أو OTF) في هذا المجلد
2. قم بتسجيل الخط في ملف \`server/lib/fonts.ts\`" > fonts/README.md
fi

# التحقق من وجود مجلد shared وإنشاء ملف حاوي للأنواع المشتركة إذا لم يكن موجوداً
if [ -f "shared/schema.ts" ]; then
  echo "✅ ملف schema.ts موجود في المجلد shared"
else
  echo "⚠️ ملف schema.ts غير موجود في المجلد shared. قد يؤدي هذا إلى حدوث مشاكل."
fi

# إنشاء ملف تكوين لمجلد uploads للتحكم بأنواع الملفات المسموحة
if [ ! -f "uploads/config.json" ]; then
  echo '{
  "allowedMimeTypes": {
    "images": ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
    "logos": ["image/jpeg", "image/png", "image/svg+xml"],
    "signatures": ["image/jpeg", "image/png", "image/svg+xml"],
    "documents": ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
  },
  "maxFileSizes": {
    "images": 5242880,
    "logos": 2097152,
    "signatures": 1048576,
    "documents": 10485760
  }
}' > uploads/config.json
fi

echo "✅ تم تكوين الأصول والمجلدات المشتركة بنجاح!"
echo "📁 المجلدات المشتركة:"
echo "  - fonts: للخطوط المستخدمة في التطبيق"
echo "  - shared: للأنواع والمخططات المشتركة بين الواجهة الأمامية والخلفية"
echo "  - temp: للملفات المؤقتة"
echo "  - uploads: لتخزين الملفات المرفوعة"
echo "    - generated: للصور المولدة من النظام"
echo "    - logos: للشعارات المرفوعة"
echo "    - signatures: للتوقيعات المرفوعة"
echo "    - images: للصور العامة المرفوعة"