/**
 * هذا الملف يوفر طريقة مركزية لاستيراد مكتبة fabric.js
 * ويضمن استخدام نفس النسخة في جميع أنحاء التطبيق
 */

// نقوم باستيراد متوافق مع ESM و CommonJS
import * as fabricModule from 'fabric';

// نتعامل مع كلا الحالتين: الوحدة الحديثة والقديمة
// @ts-ignore - تجاهل خطأ TypeScript
const fabric = fabricModule.fabric || fabricModule;

// للتأكد من أن المكتبة تم تحميلها بنجاح
if (!fabric) {
  console.error('Failed to load fabric.js library!');
}

export default fabric;
export { fabric };