/**
 * هذا ملف يحتوي على نسخة مصغرة من مكتبة canvas 
 * لتجنب الاعتماد على المكتبة الأصلية التي تتطلب مكتبات نظام إضافية
 */

export const createCanvas = (width: number, height: number) => {
  console.log(`[MOCK] Creating canvas with dimensions ${width}x${height}`);
  return {
    width,
    height,
    getContext: () => ({
      fillStyle: '#FFFFFF',
      font: '14px Arial',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      strokeStyle: '#000000',
      globalAlpha: 1.0,
      
      fillRect: () => console.log('[MOCK] fillRect called'),
      fillText: (text: string, x: number, y: number) => console.log(`[MOCK] fillText called with '${text}' at (${x},${y})`),
      drawImage: () => console.log('[MOCK] drawImage called'),
      save: () => console.log('[MOCK] save called'),
      restore: () => console.log('[MOCK] restore called'),
      translate: () => console.log('[MOCK] translate called'),
      rotate: () => console.log('[MOCK] rotate called'),
      scale: () => console.log('[MOCK] scale called'),
      beginPath: () => console.log('[MOCK] beginPath called'),
      closePath: () => console.log('[MOCK] closePath called'),
      arc: () => console.log('[MOCK] arc called'),
      clip: () => console.log('[MOCK] clip called'),
      clearRect: (x: number, y: number, w: number, h: number) => console.log(`[MOCK] clearRect called (${x},${y},${w},${h})`),
      measureText: (text: string) => ({ width: text.length * 8, height: 10 }), // تقدير تقريبي لحجم النص
      rect: (x: number, y: number, w: number, h: number) => console.log(`[MOCK] rect called (${x},${y},${w},${h})`),
      stroke: () => console.log('[MOCK] stroke called'),
      lineWidth: 1
    }),
    toBuffer: (format?: string, options?: any) => {
      console.log(`[MOCK] toBuffer called with format ${format}`);
      // صورة PNG فارغة مشفرة بالـ base64 بأبعاد 1x1 بيكسل
      return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    },
    createPNGStream: () => ({ pipe: () => ({}) }),
    createJPEGStream: () => ({ pipe: () => ({}) }),
  };
};

export const loadImage = async (path: string) => {
  console.log(`[MOCK] Loading image from ${path}`);
  return {
    width: 800,
    height: 600,
  };
};

export const registerFont = (path: string, options: any) => {
  console.log(`[MOCK] Registering font from ${path}`);
};