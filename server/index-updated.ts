import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log } from "./lib/logger";
import path from "path";
import multer from "multer";

const app = express();

// تكوين CORS لدعم الاستضافات المنفصلة
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'https://your-frontend-domain.com'];

app.use(cors({
  origin: (origin, callback) => {
    // السماح بطلبات من النوافذ نفسها (مثل الاختبار المحلي أو طلبات curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // مهم لمشاركة ملفات تعريف الارتباط بين الخوادم والمواقع
}));

// إعداد المسار الثابت للملفات المرفوعة
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// للتسجيل
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Error:", err);
  });

  // إضافة مسار تجريبي للتحقق من عمل الـ API
  app.get('/api/status', (req, res) => {
    res.json({ status: 'API is running', environment: process.env.NODE_ENV });
  });

  // استخدام المنفذ من متغيرات البيئة أو الافتراضي 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`API server running on port ${port}`);
  });
})();