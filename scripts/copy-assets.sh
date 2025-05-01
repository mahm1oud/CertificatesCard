#!/bin/bash

# سكريبت نسخ الملفات المشتركة والأصول بين الواجهة الأمامية والخلفية

echo "🔄 نسخ الملفات المشتركة والأصول..."

# إنشاء المجلدات الضرورية
mkdir -p server/dist/fonts
mkdir -p server/dist/shared
mkdir -p server/dist/uploads/generated
mkdir -p server/dist/temp

# نسخ المجلدات للواجهة الخلفية
echo "📁 نسخ الملفات للواجهة الخلفية..."
cp -r fonts/ server/dist/fonts/
cp -r shared/ server/dist/shared/

# إنشاء ملفات فارغة في المجلدات اللازمة
touch server/dist/uploads/.gitkeep
touch server/dist/uploads/generated/.gitkeep
touch server/dist/temp/.gitkeep

# نسخ ملفات البيئة
echo "🔧 نسخ ملفات البيئة..."
cp server/.env.production server/dist/.env.production

echo "✅ تم نسخ جميع الملفات المشتركة والأصول بنجاح!"