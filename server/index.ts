import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDatabaseConnection } from "./db";
import { scheduleHealthChecks } from "./lib/database-health";
import { ensureDefaultAdminExists } from "./init-db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // إنشاء مستخدم admin افتراضي
    try {
      log('🔄 التحقق من وجود مستخدم admin افتراضي...');
      ensureDefaultAdminExists()
        .then(() => {
          log('✅ تم التحقق من وجود مستخدم admin');
        })
        .catch(err => {
          log(`⚠️ خطأ في التحقق من/إنشاء مستخدم admin: ${err.message}`);
        });
    } catch (err) {
      log(`⚠️ خطأ في تهيئة مستخدم admin: ${err}`);
    }

    // بدء جدولة فحوصات صحة قاعدة البيانات (كل 5 دقائق) في بيئة الإنتاج
    if (process.env.NODE_ENV === 'production') {
      const stopHealthChecks = scheduleHealthChecks();
      // تسجيل دالة التوقف مع إنهاء العملية للتنظيف
      process.on('SIGTERM', () => {
        if (stopHealthChecks && typeof stopHealthChecks === 'object' && 'timer' in stopHealthChecks) {
          clearInterval(stopHealthChecks.timer);
        }
      });
    }
  });
})();
