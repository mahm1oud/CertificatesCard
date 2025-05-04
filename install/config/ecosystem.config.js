/**
 * ملف تكوين PM2 لإدارة تشغيل التطبيق في بيئة الإنتاج
 * يستخدم هذا الملف مع أمر: pm2 start ecosystem.config.js
 */

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
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      },
      env_development: {
        NODE_ENV: "development",
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
  ],
  deploy: {
    production: {
      user: "hostinger_username",  // استبدل باسم المستخدم الخاص بك على Hostinger
      host: "your-hostname.hostinger.com",  // استبدل بعنوان الخادم الخاص بك
      ref: "origin/main",  // الفرع الذي سيتم نشره من Git
      repo: "https://github.com/username/certificate-app.git",  // مستودع Git الخاص بالتطبيق
      path: "/home/hostinger_username/apps/certificate-app",  // مسار النشر على الخادم
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      env: {
        NODE_ENV: "production"
      }
    }
  }
};