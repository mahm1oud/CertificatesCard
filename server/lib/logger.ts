/**
 * نظام تسجيل الأحداث والأخطاء للتطبيق
 * هذا النظام يوفر واجهة موحدة لتسجيل الأحداث والأخطاء في التطبيق
 */

// مستويات التسجيل
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// تكوين نظام التسجيل
interface LoggerConfig {
  minLevel: LogLevel;
  includeTimestamp: boolean;
  colorizeOutput: boolean;
  logToFile: boolean;
  logFilePath?: string;
}

// التكوين الافتراضي
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  includeTimestamp: true,
  colorizeOutput: process.env.NODE_ENV !== 'production',
  logToFile: process.env.NODE_ENV === 'production',
  logFilePath: process.env.LOG_FILE_PATH || './logs/server.log'
};

// ألوان الطباعة المختلفة للتمييز بين مستويات التسجيل
const colors = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // سيان
  info: '\x1b[32m',  // أخضر
  warn: '\x1b[33m',  // أصفر
  error: '\x1b[31m', // أحمر
  fatal: '\x1b[35m', // أرجواني
};

/**
 * مسجل الأحداث والأخطاء
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * التحقق مما إذا كان المستوى المحدد مسموحًا بتسجيله
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  /**
   * تنسيق رسالة التسجيل
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formattedMessage = '';
    
    // إضافة الطابع الزمني
    if (this.config.includeTimestamp) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }
    
    // إضافة مستوى التسجيل
    formattedMessage += `[${level.toUpperCase()}] `;
    
    // إضافة الرسالة
    formattedMessage += message;
    
    // إضافة البيانات إذا كانت موجودة
    if (data !== undefined) {
      if (typeof data === 'object') {
        formattedMessage += ` ${JSON.stringify(data, null, 2)}`;
      } else {
        formattedMessage += ` ${data}`;
      }
    }
    
    return formattedMessage;
  }

  /**
   * تسجيل رسالة
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message, data);
    
    // طباعة الرسالة في وحدة التحكم
    if (this.config.colorizeOutput) {
      const color = colors[level] || colors.reset;
      console.log(`${color}${formattedMessage}${colors.reset}`);
    } else {
      console.log(formattedMessage);
    }
    
    // تسجيل الرسالة في ملف
    if (this.config.logToFile && this.config.logFilePath) {
      // يمكن إضافة منطق لتسجيل الرسائل في ملف هنا
      // باستخدام fs.appendFile أو مكتبة متخصصة
    }
  }

  /**
   * تسجيل رسالة تصحيح
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * تسجيل رسالة معلومات
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * تسجيل رسالة تحذير
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * تسجيل رسالة خطأ
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, {
        message: error.message,
        stack: error.stack,
        ...(error as any)
      });
    } else {
      this.log(LogLevel.ERROR, message, error);
    }
  }

  /**
   * تسجيل رسالة خطأ فادح
   */
  fatal(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.FATAL, message, {
        message: error.message,
        stack: error.stack,
        ...(error as any)
      });
    } else {
      this.log(LogLevel.FATAL, message, error);
    }
  }
}

// إنشاء نسخة عامة من المسجل للاستخدام في جميع أنحاء التطبيق
export const logger = new Logger();

// تصدير دوال مختصرة للاستخدام السريع
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const fatal = logger.fatal.bind(logger);

export default logger;