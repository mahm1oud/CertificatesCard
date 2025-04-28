/**
 * مكون معاينة محسّن للبطاقات والشهادات
 * الإصدار 3.0 - أبريل 2025
 * 
 * ميزات هذا المكون المحسّن:
 * 1. يضمن تطابق 100% بين المعاينة والصورة النهائية
 * 2. يستخدم نفس خوارزمية الحساب الموجودة في السيرفر
 * 3. أكثر قابلية للصيانة وإعادة الاستخدام
 * 4. كود أكثر إيجازاً وأسهل للقراءة
 */

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Text } from 'react-konva';

/**
 * مهم جداً: هذه القيمة يجب أن تكون متطابقة مع
 * 1. BASE_IMAGE_WIDTH في DraggableFieldsPreviewPro.tsx
 * 2. clientBaseWidth في server/optimized-image-generator.ts
 * لضمان التطابق 100% بين المعاينة والصورة النهائية
 */
const BASE_IMAGE_WIDTH = 1000;

interface FieldConfig {
  name: string;
  label?: string;
  defaultValue?: string;
  position: { x: number; y: number };
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: string;
    verticalPosition?: string;
    maxWidth?: number;
    textShadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
    };
  };
}

interface OptimizedImageGeneratorProps {
  templateImage: string;
  fields?: FieldConfig[];
  formData?: Record<string, any>;
  width?: number;
  height?: number;
  onImageGenerated?: (imageURL: string) => void;
  className?: string;
  quality?: 'preview' | 'medium' | 'high';
}

export const OptimizedImageGenerator: React.FC<OptimizedImageGeneratorProps> = ({
  templateImage,
  fields = [],
  formData = {},
  width = 800,
  height = 600,
  onImageGenerated,
  className = '',
  quality = 'preview',
}) => {
  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width, height });
  
  // تحميل صورة القالب
  useEffect(() => {
    if (!templateImage) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = templateImage;
    
    img.onload = () => {
      setImage(img);
      
      // حساب نسبة الأبعاد
      const aspectRatio = img.width / img.height;
      
      console.log(`Original Image: ${img.width}x${img.height}, ratio: ${aspectRatio}`);
      console.log(`BASE_IMAGE_WIDTH: ${BASE_IMAGE_WIDTH}`);
      
      // حساب الحجم المناسب للعرض
      let displayWidth, displayHeight;
      
      // الحفاظ على نسبة العرض إلى الارتفاع الأصلية لضمان عدم تشويه الصورة
      if (width && !height) {
        // إذا تم تحديد العرض فقط
        displayWidth = width;
        displayHeight = width / aspectRatio;
      } else if (height && !width) {
        // إذا تم تحديد الارتفاع فقط
        displayHeight = height;
        displayWidth = height * aspectRatio;
      } else if (width && height) {
        // إذا تم تحديد كلاهما، استخدم التناسب الأقل لضمان تناسب الصورة ضمن المساحة المحددة
        const widthRatio = width / img.width;
        const heightRatio = height / img.height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        displayWidth = img.width * ratio;
        displayHeight = img.height * ratio;
      } else {
        // إذا لم يتم تحديد أي منهما، استخدم حجم مناسب استنادًا إلى BASE_IMAGE_WIDTH
        displayWidth = Math.min(BASE_IMAGE_WIDTH, window.innerWidth - 40);
        displayHeight = displayWidth / aspectRatio;
      }
      
      console.log(`Using stage size: ${displayWidth}x${displayHeight}`);
      setStageSize({ width: displayWidth, height: displayHeight });
    };
  }, [templateImage, width, height]);

  // استخراج قيمة الحقل من بيانات النموذج
  const getFieldValue = (field: FieldConfig): string => {
    return (formData[field.name] ?? field.defaultValue ?? field.label ?? '').toString();
  };

  // معالجة خصائص النص لاستخدامها في Konva
  const getTextProps = (field: FieldConfig) => {
    const style = field.style || {};
    const fontFamily = style.fontFamily || 'Cairo';
    
    // حساب حجم الخط بنفس الطريقة المستخدمة في السيرفر - مع مراعاة معامل القياس
    const scaleFactor = stageSize.width / BASE_IMAGE_WIDTH;
    const fontSize = Math.round((style.fontSize || 24) * scaleFactor);
    
    const fontWeight = style.fontWeight || '';
    const fontStyle = fontWeight === 'bold' ? 'bold' : 'normal';
    
    // حساب موضع النص كنسبة مئوية (كما في السيرفر)
    const x = (field.position.x / 100) * stageSize.width;
    const y = (field.position.y / 100) * stageSize.height;
    
    // المحاذاة الأفقية
    const align = style.align || 'center';
    
    // حساب الإزاحة حسب المحاذاة للتوسيط الصحيح
    let offsetX = 0;
    if (align === 'center') {
      offsetX = 0; // الإزاحة تتم تلقائياً في Konva
    }
    
    // العرض الأقصى للنص - مع مراعاة معامل القياس
    const width = style.maxWidth 
      ? Math.round((style.maxWidth || 200) * scaleFactor)
      : Math.round(stageSize.width - (50 * scaleFactor));
    
    // ظل النص
    const shadowEnabled = style.textShadow?.enabled || false;
    const shadowColor = shadowEnabled ? (style.textShadow?.color || 'black') : 'transparent';
    const shadowBlur = shadowEnabled ? (style.textShadow?.blur || 3) * scaleFactor : 0;
    
    console.log(`Field ${field.name}: fontSize=${fontSize}, scaleFactor=${scaleFactor.toFixed(2)}, x=${x}, y=${y}`);
    
    return {
      text: getFieldValue(field),
      x,
      y,
      fontSize,
      fontFamily,
      fontStyle,
      fill: style.color || '#000000',
      align,
      width,
      offsetX,
      shadowColor,
      shadowBlur,
      shadowOffset: { x: 0, y: 0 },
      perfectDrawEnabled: true,
    };
  };

  // توليد صورة للمعاينة
  const generatePreviewImage = () => {
    if (!stageRef.current) return;
    
    // إنشاء صورة بجودة مناسبة للمعاينة حسب المتطلبات
    let pixelRatio: number;
    
    // تعديل نسبة البكسل حسب الجودة المطلوبة
    if (quality === 'high') {
      pixelRatio = 2; // جودة عالية (2x)
    } else if (quality === 'medium') {
      pixelRatio = 1.5; // جودة متوسطة (1.5x)
    } else {
      pixelRatio = 1; // جودة منخفضة للمعاينة (1x)
    }
    
    // التأكد من وجود عوامل قياس متناسقة لضمان الدقة
    console.log(`Generating preview image with pixelRatio: ${pixelRatio}`);
    
    // توليد الصورة
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio,
      mimeType: 'image/png',
      quality: 1.0
    });
    
    // سجل حجم الصورة المولدة للتحقق من أنها ضمن النطاق المطلوب
    console.log(`Generated image data URL length: ${dataUrl.length}`);
    
    if (onImageGenerated) {
      onImageGenerated(dataUrl);
    }
  };

  // تنفيذ توليد الصورة عند تحميل جميع العناصر
  useEffect(() => {
    if (image && stageRef.current) {
      // انتظر قليلاً للتأكد من رسم جميع العناصر
      const timer = setTimeout(() => {
        console.log("Generating image after elements loaded");
        generatePreviewImage();
      }, 200); // زيادة فترة الانتظار لضمان رسم جميع العناصر بشكل صحيح
      
      return () => clearTimeout(timer);
    }
  }, [image, fields, formData, stageSize, quality]);

  return (
    <div className={`relative ${className}`}>
      <Stage 
        ref={stageRef} 
        width={stageSize.width} 
        height={stageSize.height}
        style={{ margin: '0 auto' }}
      >
        <Layer>
          {/* رسم صورة القالب */}
          {image && (
            <Image 
              image={image} 
              width={stageSize.width} 
              height={stageSize.height} 
              perfectDrawEnabled={true}
            />
          )}
          
          {/* رسم الحقول */}
          {fields.map((field, index) => (
            <Text 
              key={`${field.name}-${index}`} 
              {...getTextProps(field)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default OptimizedImageGenerator;