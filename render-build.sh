#!/usr/bin/env bash
# سكريبت النشر على منصة Render

set -e

# المسار الحالي
CURRENT_DIR=$(pwd)
DEPLOY_DIR="$CURRENT_DIR/render-deploy"
BACKEND_DIR="$DEPLOY_DIR/backend"

echo "🚀 بدء عملية تحضير المشروع للنشر على Render..."

# إنشاء مجلدات النشر
echo "📂 إنشاء مجلدات النشر..."
mkdir -p "$BACKEND_DIR"
mkdir -p "$BACKEND_DIR/uploads"
mkdir -p "$BACKEND_DIR/temp"
mkdir -p "$BACKEND_DIR/fonts"

# نسخ ملفات الخادم
echo "📋 نسخ ملفات الخادم..."
cp -r "$CURRENT_DIR/server/"*.ts "$BACKEND_DIR/"
cp -r "$CURRENT_DIR/server/"*.js "$BACKEND_DIR/" 2>/dev/null || true
cp -r "$CURRENT_DIR/shared" "$DEPLOY_DIR/"

# نسخ ملفات التكوين
echo "📝 إنشاء ملفات التكوين للنشر..."
cat > "$BACKEND_DIR/package.json" << 'EOF'
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
EOF

cat > "$BACKEND_DIR/tsconfig.json" << 'EOF'
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
EOF

# إنشاء نقطة دخول بسيطة لتجنب مشاكل Vite
cat > "$BACKEND_DIR/index.js" << 'EOF'
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';

// استيراد الوحدات
import { setupAuth } from './auth.js';
import { storage } from './storage.js';

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

// إعداد تحليل الجسم JSON وشفرة URL
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
const fontsDir = path.join(process.cwd(), 'fonts');

// إنشاء المجلدات إذا لم تكن موجودة
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// تسجيل المسارات
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// استدعاء وظيفة إعداد المسارات
import('./routes.js').then(({ registerRoutes }) => {
  registerRoutes(app).listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`📁 المسار الحالي: ${process.cwd()}`);
    console.log(`🌐 المصادر المسموح بها: ${allowedOrigins.join(', ')}`);
  });
}).catch(err => {
  console.error('خطأ في تحميل المسارات:', err);
  process.exit(1);
});
EOF

echo "✅ تم إنشاء ملفات النشر بنجاح!"
echo ""
echo "📋 للنشر على Render، اتبع الخطوات التالية:"
echo "1. قم برفع محتويات مجلد $DEPLOY_DIR إلى مستودع GitHub"
echo "2. أنشئ خدمة جديدة على Render باستخدام هذا المستودع"
echo "3. حدد إعدادات البناء والتشغيل المناسبة كما هو موضح في ملف render-deploy.md"