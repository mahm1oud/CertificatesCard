#!/bin/bash

# هذا السكربت يقوم بتثبيت متطلبات مكتبة node-canvas على نظام Linux
# يجب تشغيل هذا السكربت كمستخدم root أو باستخدام sudo

# تنبيه المستخدم
echo -e "\e[1;33m⚠️ يجب تشغيل هذا السكربت كمستخدم root أو باستخدام sudo\e[0m"
echo -e "\e[1;36m🔍 جاري تثبيت متطلبات مكتبة node-canvas...\e[0m"

# التحقق من نوع التوزيعة
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    echo -e "\e[1;32m✓ تم اكتشاف توزيعة Debian/Ubuntu\e[0m"
    
    # تحديث قائمة الحزم
    apt-get update
    
    # تثبيت المتطلبات
    apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
    
elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL/Fedora
    echo -e "\e[1;32m✓ تم اكتشاف توزيعة CentOS/RHEL/Fedora\e[0m"
    
    # تثبيت المتطلبات
    yum install -y gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel
    
else
    echo -e "\e[1;31m✗ لم يتم التعرف على نوع التوزيعة\e[0m"
    echo -e "\e[1;33m⚠️ يرجى تثبيت المتطلبات يدويًا:\e[0m"
    echo -e "- build-essential (أو ما يعادلها)"
    echo -e "- libcairo2-dev (أو ما يعادلها)"
    echo -e "- libpango1.0-dev (أو ما يعادلها)"
    echo -e "- libjpeg-dev (أو ما يعادلها)"
    echo -e "- libgif-dev (أو ما يعادلها)"
    echo -e "- librsvg2-dev (أو ما يعادلها)"
    exit 1
fi

# تثبيت node-canvas عالميًا
echo -e "\e[1;36m🔧 جاري تثبيت مكتبة node-canvas...\e[0m"
npm install -g canvas

echo -e "\e[1;32m✓ تم تثبيت متطلبات مكتبة node-canvas بنجاح\e[0m"
echo -e "\e[1;36mℹ️ يمكنك الآن استخدام مكتبة node-canvas في مشروعك\e[0m"