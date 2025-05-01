import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// دالة لتكوين إعدادات Vite بناءً على بيئة التشغيل
export default defineConfig(({ mode }) => {
  // تحميل متغيرات البيئة من ملف .env المناسب
  const env = loadEnv(mode, process.cwd());
  
  // تحديد ما إذا كنا في بيئة تطوير أو إنتاج
  const isDevelopment = mode === 'development';
  
  // قاعدة URL للـ API، من متغيرات البيئة أو القيمة الافتراضية
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
  
  // إعدادات أساسية مشتركة
  const config = {
    plugins: [
      react(),
      runtimeErrorOverlay(),
    ],
    optimizeDeps: {
      include: ['fabric'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
      // تمكين source maps في بيئة التطوير فقط
      sourcemap: isDevelopment,
      // تحسينات بناء الإنتاج
      minify: !isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            // فصل مكتبات React الرئيسية
            react: ['react', 'react-dom'],
            // فصل مكتبات UI المشتركة
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-popover',
              '@radix-ui/react-toast',
              'lucide-react',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],
            // فصل مكتبات معالجة النماذج
            form: ['react-hook-form', '@hookform/resolvers', 'zod'],
            // فصل مكتبات الرسم والصور
            canvas: ['konva', 'react-konva', 'fabric'],
          }
        }
      }
    },
    server: {
      port: 3000,
      // استخدام وكيل في بيئة التطوير فقط
      proxy: isDevelopment ? {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      } : undefined
    }
  };
  
  return config;
});