# نشر تطبيق "نظام إصدار البطاقات والشهادات" على منصات مختلفة

هذا الدليل يشرح بالتفصيل كيفية نشر تطبيق "نظام إصدار البطاقات والشهادات" على منصات استضافة مختلفة، مع شرح للتحديات والحلول بشكل مفصل.

## مقدمة

تطبيق "نظام إصدار البطاقات والشهادات" هو تطبيق ويب متكامل يتكون من:
- **واجهة أمامية (Frontend)**: مبنية باستخدام React و TypeScript
- **واجهة خلفية (Backend)**: مبنية باستخدام Node.js و Express
- **قاعدة بيانات**: PostgreSQL

في هذا الدليل، سنشرح كيفية نشر كل جزء من التطبيق على منصات استضافة مختلفة.

## قبل البدء

تأكد من توفر المتطلبات التالية:

1. **إمكانية الوصول إلى السيرفر**: تأكد من أن لديك إمكانية الوصول إلى السيرفر الذي ستستضيف عليه التطبيق (SSH، FTP، إلخ).
2. **Node.js وNPM**: تأكد من تثبيت Node.js وNPM على السيرفر.
3. **قاعدة بيانات PostgreSQL**: تأكد من إنشاء قاعدة بيانات PostgreSQL وإمكانية الوصول إليها.
4. **المجلدات المشتركة**: تأكد من وجود المجلدات المشتركة (fonts, shared, temp, uploads) ونسخها إلى الواجهة الخلفية.

## هيكل الملفات

```
/
├── client/            # الواجهة الأمامية
│   ├── dist/          # ملفات البناء النهائية للواجهة الأمامية
│   ├── .env.production # متغيرات البيئة للإنتاج (الواجهة الأمامية)
│   └── ...
├── server/            # الواجهة الخلفية
│   ├── dist/          # ملفات البناء النهائية للواجهة الخلفية
│   ├── .env.production # متغيرات البيئة للإنتاج (الواجهة الخلفية)
│   └── ...
├── fonts/             # مجلد الخطوط المستخدمة
├── shared/            # المجلد المشترك بين الواجهة الأمامية والخلفية
├── temp/              # مجلد الملفات المؤقتة
├── uploads/           # مجلد الملفات المرفوعة
│   ├── generated/     # مجلد الصور المولدة
│   ├── logos/         # مجلد الشعارات
│   ├── signatures/    # مجلد التوقيعات
│   └── ...
├── scripts/           # سكريبتات البناء والنشر
│   ├── build.sh       # سكريبت البناء
│   ├── copy-assets.sh # سكريبت نسخ الأصول المشتركة
│   └── ...
└── ...
```

## تجهيز المشروع للنشر

### 1. بناء المشروع

قم بتشغيل سكريبت البناء الذي سينتج ملفات البناء النهائية للواجهة الأمامية والخلفية:

```bash
./scripts/build.sh
```

هذا السكريبت سيقوم بالخطوات التالية:
- بناء الواجهة الأمامية وإنتاج ملفات HTML/CSS/JS في مجلد `client/dist`
- بناء الواجهة الخلفية وإنتاج ملفات JS في مجلد `server/dist`
- نسخ المجلدات المشتركة (fonts, shared, uploads) إلى مجلد `server/dist`

### 2. تكوين متغيرات البيئة

#### للواجهة الأمامية (`client/.env.production`):

```
VITE_API_URL=https://api.example.com  # عنوان API الواجهة الخلفية
```

#### للواجهة الخلفية (`server/.env.production`):

```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@hostname:port/database
SESSION_SECRET=your-secure-session-key
ALLOWED_ORIGINS=https://frontend.example.com
```

## خيارات النشر

### الخيار 1: نشر الواجهة الأمامية والخلفية على نفس السيرفر

في هذا السيناريو، ستقوم بنشر الواجهة الأمامية والخلفية على نفس السيرفر. هذا الخيار مناسب للمشاريع الصغيرة والمتوسطة.

#### الخطوات:

1. **نقل الملفات**:
   ```bash
   # نقل ملفات الواجهة الأمامية
   scp -r client/dist/* user@server:/path/to/public_html/
   
   # نقل ملفات الواجهة الخلفية
   scp -r server/dist/* user@server:/path/to/api/
   ```

2. **تكوين Nginx**:
   ```nginx
   # الواجهة الأمامية
   server {
       listen 80;
       server_name frontend.example.com;
       root /path/to/public_html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   
   # الواجهة الخلفية
   server {
       listen 80;
       server_name api.example.com;
       
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

3. **تشغيل الواجهة الخلفية**:
   ```bash
   cd /path/to/api
   npm install --production
   node index.js
   ```

### الخيار 2: نشر الواجهة الأمامية على CDN والواجهة الخلفية على سيرفر منفصل

في هذا السيناريو، ستقوم بنشر الواجهة الأمامية على خدمة استضافة ستاتيكية (مثل Netlify أو Vercel) والواجهة الخلفية على سيرفر منفصل.

#### الخطوات:

1. **نشر الواجهة الأمامية على Netlify/Vercel**:
   - قم بإنشاء حساب على Netlify أو Vercel
   - قم برفع مجلد `client/dist` إلى المنصة
   - قم بتكوين متغيرات البيئة (`VITE_API_URL`)

2. **نشر الواجهة الخلفية على سيرفر منفصل**:
   ```bash
   # نقل ملفات الواجهة الخلفية
   scp -r server/dist/* user@server:/path/to/api/
   
   # تشغيل الواجهة الخلفية
   cd /path/to/api
   npm install --production
   node index.js
   ```

### الخيار 3: نشر الواجهة الأمامية والخلفية على حاويات Docker

في هذا السيناريو، ستقوم بإنشاء حاويات Docker للواجهة الأمامية والخلفية ونشرها على خدمة استضافة تدعم Docker.

#### الخطوات:

1. **إنشاء Dockerfile للواجهة الأمامية**:
   ```Dockerfile
   FROM nginx:alpine
   COPY client/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **إنشاء Dockerfile للواجهة الخلفية**:
   ```Dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY server/dist .
   COPY server/package.json server/package-lock.json ./
   RUN npm install --production
   EXPOSE 5000
   CMD ["node", "index.js"]
   ```

3. **بناء ونشر حاويات Docker**:
   ```bash
   # بناء حاويات Docker
   docker build -t frontend-image -f Dockerfile-frontend .
   docker build -t backend-image -f Dockerfile-backend .
   
   # نشر حاويات Docker
   docker push frontend-image
   docker push backend-image
   ```

## التحديات والحلول

### تحدي 1: إدارة المجلدات المشتركة

**التحدي**: كيفية إدارة المجلدات المشتركة (fonts, shared, uploads) بين الواجهة الأمامية والخلفية.

**الحل**: 
- المجلدات المشتركة تكون جزءًا من الواجهة الخلفية فقط
- الواجهة الأمامية تحصل على الملفات من الواجهة الخلفية عبر API
- استخدام سكريبت `copy-assets.sh` لنسخ المجلدات المشتركة إلى مجلد `server/dist` أثناء البناء

### تحدي 2: إدارة الملفات المرفوعة

**التحدي**: كيفية إدارة الملفات المرفوعة (صور، شعارات، توقيعات) بين البيئات المختلفة.

**الحل**:
- استخدام تخزين سحابي مثل AWS S3 أو Firebase Storage لتخزين الملفات المرفوعة
- تكوين الواجهة الخلفية للوصول إلى التخزين السحابي
- استخدام مسارات URL نسبية للملفات المرفوعة في الواجهة الأمامية

### تحدي 3: إدارة متغيرات البيئة

**التحدي**: كيفية إدارة متغيرات البيئة بين البيئات المختلفة (تطوير، اختبار، إنتاج).

**الحل**:
- استخدام ملفات `.env` و `.env.production` للواجهة الأمامية والخلفية
- تكوين متغيرات البيئة على منصات النشر (Netlify، Vercel، Heroku، إلخ)
- استخدام `cors` في الواجهة الخلفية للسماح بالوصول من الواجهة الأمامية

## استراتيجية النسخ الاحتياطي

للحفاظ على بيانات التطبيق، يجب إنشاء استراتيجية للنسخ الاحتياطي تشمل:

1. **نسخ احتياطي لقاعدة البيانات**:
   ```bash
   pg_dump -U username -h hostname -d database > backup.sql
   ```

2. **نسخ احتياطي للملفات المرفوعة**:
   ```bash
   rsync -avz user@server:/path/to/uploads/ /path/to/backup/uploads/
   ```

3. **جدولة النسخ الاحتياطي**:
   ```bash
   # إضافة مهمة cron للنسخ الاحتياطي اليومي
   0 0 * * * /path/to/backup-script.sh
   ```

## الخاتمة

في هذا الدليل، تعلمنا كيفية نشر تطبيق "نظام إصدار البطاقات والشهادات" على منصات استضافة مختلفة. تذكر أن اختيار منصة النشر المناسبة يعتمد على احتياجات مشروعك وميزانيتك.

لمزيد من المعلومات والمساعدة، راجع:
- [دليل نشر تطبيقات React](https://reactjs.org/docs/deployment.html)
- [دليل نشر تطبيقات Node.js](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [دليل استخدام Docker مع Node.js](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)