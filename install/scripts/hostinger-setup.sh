#!/bin/bash
#
# سكريبت إعداد تطبيق الشهادات على استضافة Hostinger
# 
# هذا السكريبت يقوم بإعداد التطبيق على استضافة Hostinger، بما في ذلك:
# 1. إنشاء هيكل المجلدات المطلوب
# 2. تكوين البيئة
# 3. تثبيت الاعتماديات
# 4. إعداد قاعدة البيانات
# 5. تكوين PM2
# 6. إعداد Nginx

# توقف عند أي خطأ
set -e

# ألوان لتنسيق الإخراج
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# طباعة رسالة ترحيب
echo -e "${BOLD}==================================================================${NC}"
echo -e "${BOLD}${GREEN}            إعداد تطبيق الشهادات على استضافة Hostinger             ${NC}"
echo -e "${BOLD}==================================================================${NC}"
echo ""

# التحقق من وجود المعلومات المطلوبة
read -p "أدخل اسم قاعدة البيانات MySQL: " DB_NAME
read -p "أدخل اسم مستخدم قاعدة البيانات MySQL: " DB_USER
read -s -p "أدخل كلمة مرور قاعدة البيانات MySQL: " DB_PASSWORD
echo ""
read -p "أدخل اسم النطاق (بدون http/https، مثال: example.com): " DOMAIN
read -p "أدخل المسار المطلق للتطبيق على الخادم (مثال: /home/username/apps/certificate-app): " APP_PATH

# إنشاء مسار التطبيق إذا لم يكن موجودًا
echo -e "\n${YELLOW}[1/8] إنشاء هيكل المجلدات...${NC}"
mkdir -p "$APP_PATH"
mkdir -p "$APP_PATH/logs"
mkdir -p "$APP_PATH/logs/pm2"
mkdir -p "$APP_PATH/uploads"
mkdir -p "$APP_PATH/temp"
mkdir -p "$APP_PATH/backups"
echo -e "${GREEN}✓ تم إنشاء هيكل المجلدات بنجاح.${NC}"

# الانتقال إلى مسار التطبيق
cd "$APP_PATH"

# التحقق من تثبيت Node.js
echo -e "\n${YELLOW}[2/8] التحقق من تثبيت Node.js...${NC}"
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ تم العثور على Node.js (${NODE_VERSION})${NC}"
else
    echo -e "${RED}✗ لم يتم العثور على Node.js. يرجى تثبيته أولاً.${NC}"
    exit 1
fi

# تكوين ملف .env
echo -e "\n${YELLOW}[3/8] إنشاء ملف .env...${NC}"
cat > .env << EOL
# إعدادات التطبيق الأساسية
NODE_ENV=production
PORT=5000
APP_URL=https://${DOMAIN}
APP_SECRET=$(openssl rand -hex 32)

# إعدادات قاعدة البيانات MySQL
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# إعدادات جلسات المستخدمين
SESSION_SECRET=$(openssl rand -hex 32)
SESSION_LIFETIME=86400000

# مجلدات التخزين
UPLOAD_DIR=./uploads
LOGS_DIR=./logs
TEMP_DIR=./temp
EOL
echo -e "${GREEN}✓ تم إنشاء ملف .env بنجاح.${NC}"

# إنشاء ملف تكوين التطبيق
echo -e "\n${YELLOW}[4/8] إنشاء ملف تكوين التطبيق...${NC}"
mkdir -p install/config
cat > install/config/config.json << EOL
{
  "app": {
    "name": "Certificate App",
    "baseUrl": "https://${DOMAIN}",
    "port": 5000,
    "environment": "production",
    "defaultLanguage": "ar",
    "supportedLanguages": ["ar", "en"]
  },
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "${DB_NAME}",
    "user": "${DB_USER}",
    "password": "${DB_PASSWORD}",
    "ssl": false,
    "connectionLimit": 10
  },
  "storage": {
    "type": "local",
    "uploadPath": "./uploads",
    "tempPath": "./temp",
    "publicUrl": "/uploads"
  },
  "session": {
    "secret": "$(openssl rand -hex 32)",
    "name": "certificate_app_session",
    "maxAge": 86400000,
    "secure": true,
    "httpOnly": true,
    "resave": false,
    "saveUninitialized": false
  },
  "security": {
    "bcryptRounds": 10,
    "jwtSecret": "$(openssl rand -hex 32)",
    "jwtExpiresIn": "1d",
    "csrfEnabled": true,
    "rateLimit": {
      "enabled": true,
      "windowMs": 900000,
      "max": 100
    }
  },
  "certificates": {
    "verificationEnabled": true,
    "verificationUrlFormat": "https://${DOMAIN}/verify/{code}",
    "defaultImageQuality": 90,
    "pdfEnabled": true,
    "batchProcessingEnabled": true,
    "maxBatchSize": 500
  },
  "backup": {
    "enabled": true,
    "schedule": "0 0 * * 0",
    "maxBackups": 10,
    "path": "./backups",
    "compressBackups": true
  },
  "logging": {
    "level": "info",
    "file": "./logs/app.log",
    "errorFile": "./logs/error.log",
    "maxSize": "10m",
    "maxFiles": 7,
    "format": "combined"
  }
}
EOL
echo -e "${GREEN}✓ تم إنشاء ملف التكوين بنجاح.${NC}"

# إنشاء ملف تكوين PM2
echo -e "\n${YELLOW}[5/8] إنشاء ملف تكوين PM2...${NC}"
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: "certificate-app",
      script: "server/index.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads", "temp", ".git"],
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      time: true,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 5,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      error_file: "logs/pm2/error.log",
      out_file: "logs/pm2/output.log",
      log_file: "logs/pm2/combined.log",
      combine_logs: true
    }
  ]
};
EOL
echo -e "${GREEN}✓ تم إنشاء ملف تكوين PM2 بنجاح.${NC}"

# تثبيت PM2 عالميًا
echo -e "\n${YELLOW}[6/8] تثبيت PM2...${NC}"
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ تم تثبيت PM2 بنجاح.${NC}"
else
    echo -e "${GREEN}✓ PM2 مثبت بالفعل.${NC}"
fi

# تثبيت اعتماديات التطبيق وبناء التطبيق
echo -e "\n${YELLOW}[7/8] تثبيت اعتماديات التطبيق وبناء التطبيق...${NC}"
npm install
echo -e "${GREEN}✓ تم تثبيت اعتماديات التطبيق بنجاح.${NC}"

echo -e "\n${YELLOW}[7.1/8] بناء التطبيق...${NC}"
npm run build
echo -e "${GREEN}✓ تم بناء التطبيق بنجاح.${NC}"

# إنشاء ملف Nginx
echo -e "\n${YELLOW}[8/8] إنشاء ملف تكوين Nginx...${NC}"
NGINX_CONF="server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # توجيه جميع الطلبات إلى HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN} www.${DOMAIN};

    # شهادات SSL (ستحتاج إلى تكوينها في لوحة تحكم Hostinger)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # إعدادات SSL الموصى بها
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # رأس HSTS
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;

    # مجلد التطبيق
    root ${APP_PATH};

    # سجلات Nginx
    access_log ${APP_PATH}/logs/nginx.access.log;
    error_log ${APP_PATH}/logs/nginx.error.log;

    # تكوين Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # خدمة الملفات الثابتة
    location /static {
        alias ${APP_PATH}/client/static;
        expires 30d;
        add_header Cache-Control \"public, max-age=2592000\";
    }

    # خدمة ملفات التحميل
    location /uploads {
        alias ${APP_PATH}/uploads;
        expires 30d;
        add_header Cache-Control \"public, max-age=2592000\";
    }
}
"

echo "$NGINX_CONF" > nginx.conf
echo -e "${GREEN}✓ تم إنشاء ملف تكوين Nginx بنجاح.${NC}"
echo -e "${YELLOW}ملاحظة: ستحتاج إلى نسخ محتوى ملف nginx.conf إلى ملف التكوين الخاص بك في Hostinger.${NC}"

# إنشاء دليل مفيد
echo -e "\n${BOLD}${GREEN}تم الانتهاء من الإعداد!${NC}"
echo -e "\n${BOLD}الخطوات التالية:${NC}"
echo -e "1. قم بتشغيل التطبيق باستخدام الأمر: ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo -e "2. تكوين Nginx باستخدام ملف: ${YELLOW}nginx.conf${NC}"
echo -e "3. تفعيل شهادة SSL من لوحة تحكم Hostinger"
echo -e "4. زيارة التطبيق على: ${YELLOW}https://${DOMAIN}${NC}"
echo -e "\n${BOLD}بيانات تسجيل الدخول الافتراضية:${NC}"
echo -e "اسم المستخدم: ${YELLOW}admin${NC}"
echo -e "كلمة المرور: ${YELLOW}700700${NC}"
echo -e "\n${BOLD}${RED}ملاحظة هامة: قم بتغيير كلمة المرور الافتراضية فور تسجيل الدخول!${NC}"

echo -e "\n${BOLD}==================================================================${NC}"
echo -e "${BOLD}${GREEN}       تم إعداد تطبيق الشهادات على استضافة Hostinger بنجاح!        ${NC}"
echo -e "${BOLD}==================================================================${NC}"