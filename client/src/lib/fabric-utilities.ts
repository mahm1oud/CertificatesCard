/**
 * هذا الملف يحتوي على وظائف مساعدة متعلقة بمكتبة fabric.js
 * ويوفر طريقة آمنة لاستيراد المكتبة في المشروع
 */

// استيراد مكتبة fabric.js بطريقة تدعم ESM و CommonJS
import { fabric } from 'fabric';

// تصدير fabric للاستخدام في المشروع
export { fabric };

// للتأكد من أن المكتبة متاحة فعلاً
if (!fabric) {
  console.error('fabric.js library is not loaded properly');
}

// Custom utility functions

/**
 * إضافة تأثير الظل للعناصر
 * @param object العنصر المراد إضافة الظل له
 */
export function addShadowToObject(object: fabric.Object) {
  object.set({
    shadow: new fabric.Shadow({
      color: 'rgba(0,0,0,0.3)',
      blur: 10,
      offsetX: 5,
      offsetY: 5
    })
  });
  return object;
}

/**
 * إضافة حدود للعنصر عند تحديده
 * @param canvas كائن الـ canvas
 */
export function setupSelectionStyle(canvas: fabric.Canvas) {
  canvas.selectionColor = 'rgba(0,120,215,0.2)';
  canvas.selectionBorderColor = 'rgba(0,120,215,0.8)';
  canvas.selectionLineWidth = 1;
}

/**
 * تحديث مقياس و موقع الكائن بناءً على إحداثيات نسبية
 * @param object العنصر المراد تحديثه
 * @param position الموقع النسبي (من 0 إلى 1)
 * @param canvas كائن الـ canvas
 */
export function updateObjectPositionByPercentage(
  object: fabric.Object, 
  position: { x: number, y: number }, 
  canvas: fabric.Canvas
) {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  
  object.set({
    left: position.x * canvasWidth,
    top: position.y * canvasHeight
  });
  
  canvas.renderAll();
  return object;
}

/**
 * تحويل إحداثيات الكائن إلى قيم نسبية
 * @param object العنصر المراد تحويل إحداثياته
 * @param canvas كائن الـ canvas
 */
export function getRelativePosition(object: fabric.Object, canvas: fabric.Canvas) {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  
  return {
    x: (object.left || 0) / canvasWidth,
    y: (object.top || 0) / canvasHeight
  };
}

/**
 * تحويل كائن fabric.js إلى كائن JSON قابل للتخزين
 * @param object العنصر المراد تحويله
 */
export function objectToStorableJson(object: fabric.Object) {
  const json = object.toJSON(['id', 'name', 'data']);
  return {
    ...json,
    type: object.type,
    version: '1.0' // إضافة رقم إصدار للتوافق المستقبلي
  };
}

/**
 * إنشاء كائن fabric من بيانات JSON
 * @param data بيانات JSON
 * @param canvas كائن الـ canvas
 */
export function createObjectFromJson(data: any, canvas: fabric.Canvas) {
  let object;
  
  switch (data.type) {
    case 'textbox':
    case 'text':
      object = new fabric.Textbox(data.text, data);
      break;
    case 'image':
      fabric.Image.fromURL(data.src, (img) => {
        img.set(data);
        canvas.add(img);
        canvas.renderAll();
      });
      return; // Early return because image loading is async
    case 'rect':
      object = new fabric.Rect(data);
      break;
    case 'circle':
      object = new fabric.Circle(data);
      break;
    case 'path':
      object = new fabric.Path(data.path, data);
      break;
    case 'line':
      object = new fabric.Line([data.x1, data.y1, data.x2, data.y2], data);
      break;
    default:
      console.warn(`Unsupported object type: ${data.type}`);
      return;
  }
  
  canvas.add(object);
  canvas.renderAll();
  return object;
}

// تصدير أنواع من fabric لاستخدامها في المشروع
export type FabricCanvas = fabric.Canvas;
export type FabricObject = fabric.Object;
export type FabricText = fabric.Text;
export type FabricTextbox = fabric.Textbox;
export type FabricImage = fabric.Image;
export type FabricRect = fabric.Rect;
export type FabricCircle = fabric.Circle;