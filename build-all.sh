#!/bin/bash

# سكريبت شامل لبناء وتجميع المشروع للنشر
echo "🚀 بدء عملية البناء الشاملة..."

# تنفيذ صلاحيات التنفيذ للسكريبتات داخل المجلدات
chmod +x client/build-dist.sh server/build-dist.sh
chmod +x package-files.sh

# 1. بناء الواجهة الأمامية
echo "🔹 خطوة 1 من 3: بناء الواجهة الأمامية"
cd client
./build-dist.sh
cd ..

# التحقق من نجاح بناء الواجهة
if [ ! -d "client/dist" ]; then
    echo "❌ فشل في بناء الواجهة الأمامية. توقف."
    exit 1
fi

# 2. بناء الخادم
echo "🔹 خطوة 2 من 3: بناء الخادم"
cd server
./build-dist.sh
cd ..

# التحقق من نجاح بناء الخادم
if [ ! -d "server/dist" ]; then
    echo "❌ فشل في بناء الخادم. توقف."
    exit 1
fi

# 3. تجميع الملفات للنشر
echo "🔹 خطوة 3 من 3: تجميع الملفات للنشر"
./package-files.sh

echo "🎉 تمت عملية البناء الشاملة بنجاح!"
echo "ℹ️ الملفات جاهزة للنشر في مجلد build"
echo "🌐 لنشر التطبيق، قم بنقل محتويات مجلد build إلى مجلد public_html في استضافتك"