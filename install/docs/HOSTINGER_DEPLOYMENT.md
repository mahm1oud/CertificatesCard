# دليل نشر التطبيق على استضافة Hostinger

## نظرة عامة

هذا الدليل يشرح خطوات نشر التطبيق على استضافة Hostinger باستخدام قاعدة بيانات MySQL. المستند يغطي جميع الخطوات اللازمة بدءًا من إعداد الاستضافة وحتى التكوين النهائي للتطبيق.

## المتطلبات المسبقة

قبل البدء في عملية النشر، تأكد من توفر المتطلبات التالية:

1. **حساب استضافة Hostinger** مع:
   - خطة استضافة تدعم Node.js (غالبًا الخطط المتوسطة أو المتقدمة)
   - وصول SSH (مطلوب لتثبيت التطبيق)
   - قاعدة بيانات MySQL

2. **اسم نطاق** مسجل ومكون للاستضافة

3. **ملفات المشروع** جاهزة للنشر

## خطوات النشر

### 1. إعداد قاعدة بيانات MySQL على Hostinger

1. سجل الدخول إلى لوحة تحكم Hostinger
2. انتقل إلى قسم "قواعد البيانات" > "MySQL"
3. أنشئ قاعدة بيانات جديدة:
   - قم بتعيين اسم قاعدة البيانات
   - قم بإنشاء مستخدم قاعدة بيانات وكلمة مرور قوية
   - امنح المستخدم كامل الصلاحيات على قاعدة البيانات
4. احفظ معلومات الاتصال (اسم المضيف، اسم قاعدة البيانات، اسم المستخدم، كلمة المرور)

### 2. الاتصال بالخادم عبر SSH

```bash
ssh username@your-hostinger-server.com
```

استبدل `username` بإسم المستخدم الخاص بك و `your-hostinger-server.com` بعنوان الخادم المقدم من Hostinger.

### 3. تهيئة بيئة Node.js

بعد الاتصال بالخادم عبر SSH، قم بتنفيذ الأوامر التالية لإعداد Node.js:

```bash
# إنشاء مجلد للتطبيق
mkdir -p ~/apps/certificate-app

# الانتقال إلى المجلد
cd ~/apps/certificate-app

# التأكد من تثبيت Node.js وتحديثه
# على Hostinger عادة ما يكون Node.js مثبت مسبقًا، ولكن يمكنك التحقق من الإصدار
node -v
npm -v

# قم بتغيير Node.js إلى الإصدار المطلوب إذا لزم الأمر (باستخدام nvm إذا كان متاحًا)
# nvm install 16
# nvm use 16
```

### 4. نقل ملفات التطبيق

هناك عدة طرق لنقل ملفات التطبيق:

#### الطريقة 1: باستخدام Git

```bash
# الانتقال إلى مجلد التطبيق
cd ~/apps/certificate-app

# استنساخ المستودع
git clone https://github.com/your-username/your-repo.git .

# تثبيت الاعتماديات
npm install --production
```

#### الطريقة 2: باستخدام SCP أو SFTP

1. من جهازك المحلي، استخدم أمر SCP لنقل الملفات:

```bash
# نقل الملفات باستخدام SCP
scp -r /path/to/local/project/* username@your-hostinger-server.com:~/apps/certificate-app/
```

2. أو استخدم برنامج SFTP مثل FileZilla لنقل الملفات.

3. بعد نقل الملفات، اتصل بالخادم عبر SSH وقم بتثبيت الاعتماديات:

```bash
cd ~/apps/certificate-app
npm install --production
```

### 5. تحويل قاعدة البيانات من PostgreSQL إلى MySQL

لتحويل قاعدة البيانات من PostgreSQL إلى MySQL، استخدم سكريبت التحويل المضمن:

```bash
# الانتقال إلى مجلد التطبيق
cd ~/apps/certificate-app

# إنشاء ملف الإعدادات
cp install/config/env.template .env

# تعديل ملف الإعدادات لاستخدام معلومات MySQL
nano .env
```

قم بتحديث ملف `.env` باستخدام معلومات قاعدة بيانات MySQL الخاصة بك:

```
DB_TYPE=mysql
DB_HOST=your-mysql-host.hostinger.com
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

ثم قم بتنفيذ سكريبت تحويل قاعدة البيانات:

```bash
# تثبيت اعتماديات إضافية إذا لزم الأمر
npm install mysql2

# تشغيل سكريبت التحويل
node install/scripts/convert-pg-to-mysql.js
```

### 6. تكوين التطبيق

قم بتعديل ملف التكوين الرئيسي:

```bash
# إنشاء ملف التكوين إذا لم يكن موجودًا
mkdir -p install/config
cp install/config/config.json.example install/config/config.json

# تعديل ملف التكوين
nano install/config/config.json
```

قم بتحديث ملف التكوين باستخدام المعلومات المناسبة:

```json
{
  "app": {
    "name": "Certificate App",
    "baseUrl": "https://your-domain.com",
    "port": 5000,
    "environment": "production"
  },
  "database": {
    "type": "mysql",
    "host": "your-mysql-host.hostinger.com",
    "port": 3306,
    "database": "your-db-name",
    "user": "your-db-username",
    "password": "your-db-password"
  },
  "storage": {
    "type": "local",
    "uploadPath": "./uploads"
  },
  "session": {
    "secret": "your-secure-session-secret",
    "maxAge": 86400000
  }
}
```

### 7. بناء التطبيق

قبل تشغيل التطبيق، يجب بناؤه لإنتاج ملفات الواجهة الأمامية المُحسّنة:

```bash
# بناء التطبيق للإنتاج
npm run build
```

هذا الأمر سينفذ عمليات مختلفة:
1. ترجمة ملفات TypeScript إلى JavaScript
2. تجميع وضغط ملفات CSS و JavaScript
3. تحسين الصور وضغطها
4. إنشاء ملفات الإنتاج النهائية في مجلد `dist/`

### 8. إعداد PM2 لإدارة العمليات

PM2 هو مدير عمليات لتطبيقات Node.js يساعد في تشغيل التطبيق في الخلفية وإعادة تشغيله تلقائيًا عند حدوث أي خطأ.

```bash
# تثبيت PM2 عالميًا
npm install -g pm2

# إنشاء ملف تكوين PM2
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "certificate-app",
    script: "server/index.js",
    env: {
      NODE_ENV: "production"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
EOL

# بدء تشغيل التطبيق باستخدام PM2
pm2 start ecosystem.config.js

# تكوين PM2 للتشغيل التلقائي عند إعادة تشغيل الخادم
pm2 startup
# اتبع التعليمات المعروضة

# حفظ تكوين PM2
pm2 save
```

### 8. تكوين Nginx كبروكسي عكسي

Hostinger عادة ما يستخدم Nginx كخادم ويب. قم بتكوين Nginx للعمل كبروكسي عكسي لتطبيق Node.js:

قم بإنشاء ملف تكوين Nginx (هذا قد يختلف حسب إعدادات Hostinger، قد تحتاج إلى الاتصال بالدعم للحصول على المساعدة):

```bash
# قد تحتاج لاستخدام محرر النصوص المتوفر في لوحة تحكم Hostinger لتعديل ملف تكوين Nginx
```

محتوى ملف التكوين:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9. إعداد HTTPS (SSL)

Hostinger يوفر شهادات SSL مجانية من Let's Encrypt. يمكنك تفعيلها من لوحة التحكم:

1. انتقل إلى لوحة تحكم Hostinger
2. اختر النطاق الخاص بك
3. انتقل إلى قسم "SSL/TLS"
4. انقر على "تثبيت شهادة SSL"
5. اختر "Let's Encrypt" واتبع التعليمات

### 10. اختبار التطبيق

بعد اكتمال جميع الخطوات، قم بزيارة النطاق الخاص بك للتأكد من أن التطبيق يعمل بشكل صحيح:

```
https://your-domain.com
```

تأكد من اختبار المزايا الرئيسية للتطبيق:
- تسجيل الدخول
- عرض القوالب
- إنشاء شهادة جديدة
- التحقق من صحة الشهادات

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة وحلولها

| المشكلة | السبب المحتمل | الحل |
|---------|---------------|------|
| التطبيق لا يعمل | خطأ في تكوين PM2 | تحقق من سجلات PM2: `pm2 logs` |
| خطأ في الاتصال بقاعدة البيانات | معلومات اتصال خاطئة | تحقق من ملف `.env` و `config.json` |
| خطأ 502 Bad Gateway | مشكلة في تكوين Nginx | تحقق من ملف تكوين Nginx وأعد تحميل التكوين |
| مجلد التحميلات غير قابل للكتابة | مشكلة في الأذونات | قم بتغيير أذونات المجلد: `chmod -R 755 uploads` |

### التحقق من السجلات

```bash
# سجلات PM2
pm2 logs

# سجلات Nginx (قد تختلف المواقع)
sudo cat /var/log/nginx/error.log

# سجلات التطبيق
cat logs/app.log
cat logs/error.log
```

## الصيانة الدورية

### تحديث التطبيق

لتحديث التطبيق إلى إصدار جديد:

```bash
# الانتقال إلى مجلد التطبيق
cd ~/apps/certificate-app

# إذا كنت تستخدم Git
git pull

# أو قم بنقل الملفات المحدثة عبر SCP/SFTP

# تثبيت الاعتماديات الجديدة
npm install --production

# إعادة تشغيل التطبيق
pm2 restart certificate-app
```

### النسخ الاحتياطي الدوري

قم بجدولة نسخ احتياطية دورية باستخدام cron:

```bash
# فتح محرر crontab
crontab -e

# إضافة مهمة للنسخ الاحتياطي اليومي (3 صباحًا)
0 3 * * * cd ~/apps/certificate-app && node install/scripts/backup.js backup
```

---

## ملاحظات إضافية

### تخصيص النظام

إذا كنت ترغب في تخصيص النظام (الألوان، الشعار، إلخ)، يمكنك تعديل الملفات التالية:

- `client/src/index.css` - لتغيير الألوان والأنماط الأساسية
- `client/static/logo.png` - لاستبدال الشعار

### التكامل مع خدمات أخرى

إذا كنت ترغب في التكامل مع خدمات إضافية مثل إرسال البريد الإلكتروني أو الإشعارات، قم بتحديث ملف `.env` بالمعلومات اللازمة:

```
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@your-domain.com
```

للمزيد من المساعدة، يرجى الاتصال بفريق الدعم الفني.