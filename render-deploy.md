# دليل النشر على منصة Render

لتجاوز مشكلة استيراد ملف `vite.config.ts` عند النشر على Render، اتبع الخطوات التالية:

## الخطوة 1: تحضير الملفات للنشر

1. قم بإنشاء مجلد جديد للنشر:
```bash
mkdir render-deploy
mkdir render-deploy/backend
```

2. انسخ ملفات الخادم إلى المجلد الجديد:
```bash
cp -r server/* render-deploy/backend/
```

3. قم بإنشاء ملف `package.json` مخصص للنشر:
```json
{
  "name": "certificates-card-backend",
  "version": "1.0.0",
  "description": "Backend API for Certificates and Cards Generator",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "build": "tsc"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "bcryptjs": "^2.4.3",
    "canvas": "^2.11.2",
    "connect-pg-simple": "^9.0.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.30.2",
    "express": "^4.18.3",
    "express-session": "^1.18.0",
    "fabric": "^5.3.0",
    "multer": "^1.4.5-lts.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "sharp": "^0.33.2",
    "ws": "^8.16.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.25",
    "typescript": "^5.4.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

4. قم بإنشاء ملف `index.js` مبسط للنشر (بدلاً من استخدام index.ts مع vite):
```javascript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { setupAuth } from './auth.js';
import { storage } from './storage.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// تكوين CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('غير مسموح بسبب سياسة CORS'));
    }
  },
  credentials: true
}));

// ضبط الجلسات
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // يوم واحد
  },
  store: storage.sessionStore
}));

// إعداد وتركيب المصادقة
setupAuth(app);

// ضبط تخزين الملفات المرفوعة
const uploadsDir = path.join(process.cwd(), 'uploads');
const tempDir = path.join(process.cwd(), 'temp');

// إنشاء المجلدات إذا لم تكن موجودة
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// تسجيل المسارات
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// استدعاء وظيفة إعداد المسارات
import('./routes.js').then(({ registerRoutes }) => {
  registerRoutes(app).listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  });
}).catch(err => {
  console.error('خطأ في تحميل المسارات:', err);
  process.exit(1);
});
```

5. قم بإنشاء ملف `tsconfig.json` مناسب للنشر:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "./dist",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## الخطوة 2: تكوين البناء في Render

في لوحة تحكم Render، قم بإعداد خدمة Web Service جديدة:

- **Runtime**: Node
- **Build Command**: `cd render-deploy/backend && npm install && npm run build`
- **Start Command**: `cd render-deploy/backend && node index.js`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `SESSION_SECRET`: (قيمة عشوائية آمنة)
  - `DATABASE_URL`: (عنوان اتصال قاعدة البيانات)
  - `ALLOWED_ORIGINS`: (قائمة بالمصادر المسموح بها، مفصولة بفواصل)

## الخطوة 3: نشر الواجهة الأمامية

يمكن نشر الواجهة الأمامية على Render كخدمة Static Site:

- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`
- **Environment Variables**:
  - `VITE_API_URL`: (عنوان URL للواجهة الخلفية)

## ملاحظة هامة

هذا النهج يتجنب استخدام ملف `vite.ts` في الإنتاج، مما يحل مشكلة استيراد `vite.config.ts`. بدلاً من ذلك، نستخدم نهجًا مبسطًا يناسب بيئة الإنتاج.