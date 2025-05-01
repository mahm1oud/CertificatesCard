/**
 * وحدة التسجيل (Logger) البسيطة
 * تدعم تسجيل الأحداث بمستويات مختلفة وطباعة الوقت والتاريخ
 */

// ألوان ANSI لتنسيق الإخراج في وحدة التحكم
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// مستويات التسجيل
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// الإعدادات
let currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO  // في بيئة الإنتاج، لا نطبع رسائل التصحيح
  : LogLevel.DEBUG; // في بيئة التطوير، نطبع كل شيء

/**
 * تعيين مستوى التسجيل الحالي
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * الحصول على الوقت والتاريخ الحاليين كنص
 */
function getTimestamp(): string {
  return new Date().toLocaleTimeString();
}

/**
 * تسجيل رسالة تصحيح (مفصلة)
 */
export function debug(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(`${colors.gray}${getTimestamp()}${colors.reset} [${colors.cyan}debug${colors.reset}] ${message}`);
    if (context) console.log(context);
  }
}

/**
 * تسجيل رسالة معلومات
 * يستخدم كدالة تسجيل عامة
 */
export function log(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(`${colors.gray}${getTimestamp()}${colors.reset} [${colors.green}express${colors.reset}] ${message}`);
    if (context) console.log(context);
  }
}

/**
 * تسجيل رسالة تحذير
 */
export function warn(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.log(`${colors.gray}${getTimestamp()}${colors.reset} [${colors.yellow}warn${colors.reset}] ${message}`);
    if (context) console.log(context);
  }
}

/**
 * تسجيل رسالة خطأ
 */
export function error(message: string, context?: any): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(`${colors.gray}${getTimestamp()}${colors.reset} [${colors.red}error${colors.reset}] ${message}`);
    if (context) console.error(context);
  }
}

// كائن يجمع كل دوال التسجيل للاستيراد المباشر
export default {
  debug,
  log,
  warn,
  error,
  setLogLevel,
};