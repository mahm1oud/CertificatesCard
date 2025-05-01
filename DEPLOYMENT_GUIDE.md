# دليل النشر الشامل لنظام إصدار البطاقات والشهادات

## أولاً: اختيار طريقة النشر

هناك عدة طرق لنشر هذا النظام، اختر الطريقة المناسبة لاحتياجاتك:

1. **النشر باستخدام Docker**: الأنسب للنشر على خوادم VPS أو البيئات المحلية
2. **النشر على Render**: الأنسب للنشر السريع على منصات سحابية
3. **النشر المنفصل**: الأنسب إذا كنت ترغب في استضافة الواجهة الأمامية والخلفية على منصات مختلفة

## النشر باستخدام Docker

### متطلبات مسبقة
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### خطوات النشر

1. قم بتنفيذ سكريبت بناء صورة Docker:
```bash
chmod +x scripts/docker-build.sh
./scripts/docker-build.sh
```

2. قم بتعديل متغيرات البيئة في ملف `.env` باستخدام ملف `.env.example` كمرجع.

3. قم بتشغيل التطبيق باستخدام Docker Compose:
```bash
docker-compose up -d
```

4. تحقق من حالة الخدمات:
```bash
docker-compose ps
```

### النسخ الاحتياطية

لإنشاء نسخة احتياطية لقاعدة البيانات:
```bash
./scripts/db-backup.sh
```

## النشر على Render

### متطلبات مسبقة
- [حساب على Render](https://render.com)
- [Git](https://git-scm.com/)

### خطوات النشر

1. قم بتحضير مشروع النشر باستخدام السكريبت المرفق:
```bash
chmod +x render-build.sh
./render-build.sh
```

2. انشئ مستودعًا جديدًا على GitHub وادفع محتويات مجلد `render-deploy`:
```bash
cd render-deploy
git init
git add .
git commit -m "Initial commit for deployment"
git remote add origin https://github.com/your-username/certificates-deploy.git
git push -u origin main
```

3. انتقل إلى [لوحة تحكم Render](https://dashboard.render.com/) وأنشئ خدمة جديدة:
   - **Backend Service**:
     - نوع الخدمة: Web Service
     - مستودع GitHub: المستودع الذي أنشأته في الخطوة 2
     - اسم الخدمة: certificates-api
     - أمر البناء: `npm install && npm run build`
     - أمر البدء: `node index.js`
     - متغيرات البيئة:
       - `NODE_ENV`: `production`
       - `DATABASE_URL`: عنوان قاعدة بيانات PostgreSQL
       - `SESSION_SECRET`: مفتاح عشوائي آمن
       - `PORT`: `10000`

   - **Frontend Service**:
     - نوع الخدمة: Static Site
     - مستودع GitHub: المستودع الذي يحتوي على الواجهة الأمامية
     - مجلد النشر: `dist`
     - أمر البناء: `npm install && npm run build`
     - متغيرات البيئة:
       - `VITE_API_URL`: عنوان URL للخدمة الخلفية (من الخطوة السابقة)

4. بعد الانتهاء من النشر، قم بتحديث الإعداد `ALLOWED_ORIGINS` في الخدمة الخلفية ليتضمن عنوان URL للخدمة الأمامية.

## النشر المنفصل

### الواجهة الأمامية

يمكن نشر الواجهة الأمامية على أي منصة تدعم استضافة المواقع الثابتة:

#### على Netlify:
1. قم ببناء الواجهة الأمامية:
```bash
cd client && npm run build
```

2. قم بتحميل مجلد `client/dist` إلى Netlify.

3. قم بتكوين متغيرات البيئة:
   - `VITE_API_URL`: عنوان URL للواجهة الخلفية

#### على Vercel:
1. قم بتوصيل مستودع GitHub بـ Vercel.
2. قم بتكوين إعدادات النشر:
   - المجلد الجذر: `client`
   - أمر البناء: `npm run build`
   - مجلد النشر: `dist`
   - متغيرات البيئة:
     - `VITE_API_URL`: عنوان URL للواجهة الخلفية

### الواجهة الخلفية

يمكن نشر الواجهة الخلفية على أي منصة تدعم تشغيل تطبيقات Node.js:

#### على خادم VPS:
1. قم بإعداد قاعدة بيانات PostgreSQL.
2. قم بتثبيت Node.js والاعتماديات اللازمة.
3. قم بنسخ ملفات المشروع والبناء:
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
cd server && npm run build
```

4. قم بإنشاء ملف `.env` وتكوين المتغيرات اللازمة.
5. قم بتشغيل التطبيق باستخدام PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name certificates-api
```

## إعدادات إضافية

### إعداد مجال مخصص

لإعداد مجال مخصص، اتبع وثائق منصة الاستضافة المستخدمة:
- [إعداد مجال مخصص على Render](https://render.com/docs/custom-domains)
- [إعداد مجال مخصص على Netlify](https://docs.netlify.com/domains-https/custom-domains/)
- [إعداد مجال مخصص على Vercel](https://vercel.com/docs/projects/domains)

### إعداد شهادات SSL

معظم منصات الاستضافة السحابية تقوم بإعداد شهادات SSL تلقائيًا. إذا كنت تستخدم خادمًا خاصًا، يمكنك استخدام [Certbot](https://certbot.eff.org/) للحصول على شهادة SSL مجانية من Let's Encrypt.

## استكشاف الأخطاء وإصلاحها

### مشاكل CORS

إذا واجهت مشاكل CORS، تأكد من:
1. تكوين `ALLOWED_ORIGINS` بشكل صحيح في الواجهة الخلفية
2. تكوين `VITE_API_URL` بشكل صحيح في الواجهة الأمامية

### مشاكل قاعدة البيانات

إذا واجهت مشاكل في الاتصال بقاعدة البيانات:
1. تأكد من صحة عنوان `DATABASE_URL`
2. تحقق من وجود وتكوين المخطط (schema) بشكل صحيح

### مشاكل الملفات المرفوعة

إذا واجهت مشاكل في تحميل أو عرض الملفات:
1. تأكد من وجود وصلاحيات مجلدات `uploads` و `temp`
2. تحقق من إعدادات CORS والمصادقة

## للمساعدة والدعم

إذا واجهتك أي مشاكل أثناء النشر، يرجى الرجوع إلى:
- وثائق المشروع المتاحة في مجلد `docs`
- فتح مشكلة (issue) على مستودع GitHub للمشروع