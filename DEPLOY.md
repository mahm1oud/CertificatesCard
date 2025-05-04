# دليل النشر على منصات استضافة مختلفة

هذا الدليل يشرح كيفية نشر تطبيق "نظام إصدار البطاقات والشهادات" على منصات استضافة مختلفة.

## المتطلبات الأساسية

- قبل البدء بعملية النشر، تأكد من تجهيز المشروع وبنائه باستخدام:
  ```bash
  ./scripts/setup.sh  # لتثبيت الإعتماديات
  ./scripts/build.sh  # لبناء المشروع
  ```

## الجزء الأول: نشر الواجهة الخلفية (Backend)

### الخيار 1: النشر على Render.com

1. قم بإنشاء حساب على [Render.com](https://render.com) إذا لم يكن لديك حساب بالفعل.
2. اضغط على "New Web Service" من لوحة التحكم.
3. قم بتوصيل حسابك على GitHub أو قم برفع المشروع يدوياً.
4. في إعدادات الخدمة:
   - **Name**: `certificates-api` (أو أي اسم آخر)
   - **Runtime Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && node dist/index.js`
   - **Environment Variables**:
     - `PORT`: `10000` (أو منفذ آخر)
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: `your-secure-session-key`
     - `ALLOWED_ORIGINS`: `https://your-frontend-domain.com`
     - `DATABASE_URL`: عنوان قاعدة البيانات PostgreSQL الخاصة بك

5. في قسم **Resources**، قم بإضافة قاعدة بيانات PostgreSQL.
6. اضغط على "Create Web Service" لبدء عملية النشر.

### الخيار 2: النشر على Heroku

1. قم بتثبيت Heroku CLI على جهازك:
   ```bash
   npm install -g heroku
   ```

2. قم بتسجيل الدخول:
   ```bash
   heroku login
   ```

3. إنشاء تطبيق جديد:
   ```bash
   heroku create certificates-api
   ```

4. إضافة قاعدة بيانات PostgreSQL:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

5. تعيين متغيرات البيئة:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secure-session-key
   heroku config:set ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

6. نشر الكود:
   ```bash
   git subtree push --prefix server heroku main
   ```

## الجزء الثاني: نشر الواجهة الأمامية (Frontend)

### الخيار 1: النشر على Netlify

1. قم بإنشاء حساب على [Netlify](https://netlify.com) إذا لم يكن لديك حساب بالفعل.
2. من لوحة التحكم، اضغط على "New site from Git" أو اسحب وأفلت مجلد `client/dist` مباشرة.
3. إذا اخترت "New site from Git":
   - اختر مستودع GitHub الخاص بك
   - **Build command**: `cd client && npm install && npm run build`
   - **Publish directory**: `client/dist`
   - **Environment variables**:
     - `VITE_API_URL`: `https://your-backend-domain.com`

4. اضغط على "Deploy site" لبدء عملية النشر.

### الخيار 2: النشر على Vercel

1. قم بإنشاء حساب على [Vercel](https://vercel.com) إذا لم يكن لديك حساب بالفعل.
2. من لوحة التحكم، اضغط على "New Project".
3. قم بتوصيل حسابك على GitHub واختر المستودع.
4. في إعدادات المشروع:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://your-backend-domain.com`

5. اضغط على "Deploy" لبدء عملية النشر.

## الجزء الثالث: ربط الواجهة الأمامية بالواجهة الخلفية

1. بعد نشر الواجهة الخلفية، احصل على عنوان URL الخاص بها.
2. في إعدادات الواجهة الأمامية، قم بتعيين متغير البيئة `VITE_API_URL` ليكون عنوان URL للواجهة الخلفية.
3. قم بإعادة نشر الواجهة الأمامية لتطبيق التغييرات.

## الجزء الرابع: تكوين نطاق مخصص (اختياري)

### على Netlify (للواجهة الأمامية)

1. انتقل إلى "Domain settings" في تطبيقك على Netlify.
2. اضغط على "Add custom domain" وأدخل اسم النطاق الذي ترغب باستخدامه.
3. اتبع التعليمات لتكوين سجلات DNS.

### على Render أو Heroku (للواجهة الخلفية)

1. انتقل إلى إعدادات التطبيق.
2. ابحث عن قسم "Custom Domain" أو "Domains".
3. أضف النطاق المخصص واتبع التعليمات لتكوين سجلات DNS.

## الخاتمة

بعد إكمال جميع الخطوات أعلاه، سيكون لديك:
- واجهة أمامية مستضافة على Netlify أو Vercel، متصلة بواجهة خلفية
- واجهة خلفية مستضافة على Render أو Heroku، مع قاعدة بيانات PostgreSQL
- اتصال آمن بين المكونين باستخدام CORS المكوّن بشكل صحيح

تذكر أن تحدث متغير `ALLOWED_ORIGINS` في الواجهة الخلفية كلما قمت بتغيير عنوان URL للواجهة الأمامية.

للحصول على مساعدة إضافية، راجع وثائق المنصات المذكورة أعلاه أو ارجع إلى ملف `README.md` للمشروع.