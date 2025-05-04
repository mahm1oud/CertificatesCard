#!/bin/bash

# سكريبت إنشاء ملفات متغيرات البيئة للتطوير والإنتاج
# يستخدم هذا السكريبت لإنشاء ملفات متغيرات البيئة (.env و .env.production) للواجهة الأمامية والخلفية

echo "🔧 إنشاء ملفات متغيرات البيئة (.env و .env.production)..."

# إنشاء ملف .env للواجهة الأمامية
if [ -f "client/.env" ]; then
  echo "✅ ملف client/.env موجود بالفعل."
else
  echo "📝 إنشاء ملف client/.env..."
  echo 'VITE_API_URL=http://localhost:5000' > client/.env
  echo "✅ تم إنشاء ملف client/.env بنجاح."
fi

# إنشاء ملف .env.production للواجهة الأمامية
if [ -f "client/.env.production" ]; then
  echo "✅ ملف client/.env.production موجود بالفعل."
else
  echo "📝 إنشاء ملف client/.env.production..."
  echo '# عنوان API الواجهة الخلفية في بيئة الإنتاج
# قم بتعديل هذا العنوان ليكون مطابقًا لعنوان API الواجهة الخلفية في بيئة الإنتاج
VITE_API_URL=https://api.example.com' > client/.env.production
  echo "✅ تم إنشاء ملف client/.env.production بنجاح."
fi

# إنشاء ملف .env للواجهة الخلفية
if [ -f "server/.env" ]; then
  echo "✅ ملف server/.env موجود بالفعل."
else
  echo "📝 إنشاء ملف server/.env..."
  echo 'PORT=5000
NODE_ENV=development
SESSION_SECRET=development-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173' > server/.env
  
  # إضافة رابط قاعدة البيانات إذا كان متوفراً
  if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL=$DATABASE_URL" >> server/.env
    echo "✅ تم إضافة رابط قاعدة البيانات إلى ملف server/.env."
  else
    echo "# أضف رابط قاعدة البيانات الخاص بك هنا
# DATABASE_URL=postgresql://username:password@hostname:port/database" >> server/.env
    echo "⚠️ لم يتم العثور على متغير البيئة DATABASE_URL. يرجى إضافته يدويًا إلى ملف server/.env."
  fi
  
  echo "✅ تم إنشاء ملف server/.env بنجاح."
fi

# إنشاء ملف .env.production للواجهة الخلفية
if [ -f "server/.env.production" ]; then
  echo "✅ ملف server/.env.production موجود بالفعل."
else
  echo "📝 إنشاء ملف server/.env.production..."
  echo '# متغيرات البيئة للواجهة الخلفية في بيئة الإنتاج
PORT=5000
NODE_ENV=production

# قم بتعيين مفتاح آمن لجلسات المستخدمين (يجب تغييره في بيئة الإنتاج)
SESSION_SECRET=secure-production-session-key

# قم بتعيين النطاقات المسموح لها بالوصول إلى API (CORS)
# قم بإضافة عنوان URL للواجهة الأمامية في بيئة الإنتاج
ALLOWED_ORIGINS=https://frontend.example.com

# رابط قاعدة البيانات
# قم بتعيين رابط قاعدة البيانات الخاص بك في بيئة الإنتاج
# DATABASE_URL=postgresql://username:password@hostname:port/database

# إعدادات التخزين السحابي (اختياري)
# STORAGE_TYPE=s3
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_REGION=your-region
# S3_BUCKET=your-bucket-name' > server/.env.production
  echo "✅ تم إنشاء ملف server/.env.production بنجاح."
fi

echo "✅ تم إنشاء جميع ملفات متغيرات البيئة بنجاح!"
echo ""
echo "⚠️ ملاحظة هامة:"
echo "  - قبل النشر في بيئة الإنتاج، تأكد من تعديل ملفات .env.production بالقيم الصحيحة."
echo "  - تأكد من تعيين رابط قاعدة البيانات الصحيح في server/.env.production."
echo "  - تأكد من تعيين عنوان API الصحيح في client/.env.production."