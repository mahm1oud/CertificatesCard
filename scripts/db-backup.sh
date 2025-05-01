#!/bin/bash

# سكريبت لعمل نسخة احتياطية من قاعدة البيانات والملفات المرفوعة

# التاريخ الحالي بتنسيق YYYY-MM-DD
DATE=$(date +"%Y-%m-%d")

# مجلد النسخ الاحتياطية
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# اسم ملف النسخة الاحتياطية
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
FILES_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$DATE.tar.gz"

# عمل نسخة احتياطية من قاعدة البيانات
echo "🗄️ جاري عمل نسخة احتياطية من قاعدة البيانات..."

# التحقق من وجود متغير DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  # محاولة الحصول على متغير DATABASE_URL من ملف .env
  if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
  fi
  
  # التحقق مرة أخرى
  if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ متغير DATABASE_URL غير موجود. يرجى تعيينه قبل تشغيل هذا السكريبت."
    exit 1
  fi
fi

# استخدام pg_dump لعمل نسخة احتياطية من قاعدة البيانات
pg_dump "$DATABASE_URL" > "$DB_BACKUP_FILE"

# التحقق من نجاح العملية
if [ $? -eq 0 ]; then
  echo "✅ تم عمل نسخة احتياطية من قاعدة البيانات بنجاح في: $DB_BACKUP_FILE"
else
  echo "❌ فشل عمل نسخة احتياطية من قاعدة البيانات."
  exit 1
fi

# عمل نسخة احتياطية من المجلدات المرفوعة
echo "📦 جاري عمل نسخة احتياطية من الملفات المرفوعة..."

# التحقق من وجود مجلد uploads
if [ -d "uploads" ]; then
  tar -czf "$FILES_BACKUP_FILE" uploads
  
  # التحقق من نجاح العملية
  if [ $? -eq 0 ]; then
    echo "✅ تم عمل نسخة احتياطية من الملفات المرفوعة بنجاح في: $FILES_BACKUP_FILE"
  else
    echo "❌ فشل عمل نسخة احتياطية من الملفات المرفوعة."
    exit 1
  fi
else
  echo "⚠️ مجلد uploads غير موجود. تم تخطي عمل نسخة احتياطية من الملفات المرفوعة."
fi

# إظهار معلومات النسخ الاحتياطية
echo "🎉 تمت عملية النسخ الاحتياطي بنجاح!"
echo "📊 معلومات النسخ الاحتياطية:"
echo "  - حجم نسخة قاعدة البيانات: $(du -h "$DB_BACKUP_FILE" | cut -f1)"

if [ -f "$FILES_BACKUP_FILE" ]; then
  echo "  - حجم نسخة الملفات المرفوعة: $(du -h "$FILES_BACKUP_FILE" | cut -f1)"
fi

echo "📁 مجلد النسخ الاحتياطية: $BACKUP_DIR"
echo ""
echo "🔄 لاستعادة قاعدة البيانات:"
echo "  psql \$DATABASE_URL < $DB_BACKUP_FILE"
echo ""
echo "🔄 لاستعادة الملفات المرفوعة:"
echo "  tar -xzf $FILES_BACKUP_FILE"